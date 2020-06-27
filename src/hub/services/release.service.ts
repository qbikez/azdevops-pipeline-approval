import {
  ReleaseRestClient,
  ReleaseApproval,
  DeploymentStatus,
  DeploymentOperationStatus,
  BuildArtifactDownloadInput,
  Release,
} from "azure-devops-extension-api/Release";

import { BuildRestClient, Build } from "azure-devops-extension-api/Build";
import {
  WorkItemTrackingRestClient,
  WorkItem,
} from "azure-devops-extension-api/WorkItemTracking";
import {
  GitRestClient,
  GitCommit,
  GitPullRequest,
} from "azure-devops-extension-api/Git";
import {
  IProjectPageService,
  CommonServiceIds,
  IProjectInfo,
} from "azure-devops-extension-api";
import { SDK, getClient } from "../mocks/sdkMock";
import { ResourceRef } from "azure-devops-extension-api/WebApi";
import { ReleaseData } from "../components/grid/releaseapprovalgrid.component";

export interface ReleaseInfo {
  release?: Release;
  nextReleases?: Release[];

  build?: Build;
  buildWorkItems?: WorkItem[];

  pr?: GitPullRequest;
  prWorkItems?: WorkItem[];
  prId?: number;
  prName?: string;
}

export class ReleaseService {
  async getReleaseInfo(
    releaseId: number,
    includeNextReleases: boolean = false
  ): Promise<ReleaseInfo> {
    try {
      const organization = SDK.getHost().name;
      const projectService = await SDK.getService<IProjectPageService>(
        CommonServiceIds.ProjectPageService
      );
      const project = await projectService.getProject();
      if (!project) return {};

      const release = await this.getRelease(project, releaseId);
      const nextReleases = includeNextReleases
        ? await this.getReleasesAfter(project, release)
        : undefined;

      const releaseInfo = await this.getSingleReleaseDetails(
        organization,
        project,
        release
      );
      releaseInfo.nextReleases = nextReleases;
      return releaseInfo;
    } catch (err) {
      console.error(err);
      return {};
    }
  }

  private async getSingleReleaseDetails(
    organization: string,
    project: IProjectInfo,
    release: Release
  ) {
    let releaseInfo: ReleaseInfo = {
      release,
    };
    const build = await this.getBuild(project, release);

    if (!build) return releaseInfo;

    releaseInfo.build = build;

    const workItemRefs = await this.getBuildWorkItems(project, build);
    const workItems = await this.getWorkItems(
      workItemRefs,
      organization,
      project
    );

    releaseInfo.buildWorkItems = workItems;

    const { pr, name: prName } = await this.getPr(project, build);

    if (pr) {
      releaseInfo.pr = pr;
      releaseInfo.prId = pr?.pullRequestId;
      releaseInfo.prName = prName;

      const prWorkItems = await this.getWorkItems(
        pr.workItemRefs,
        organization,
        project
      );
      releaseInfo.prWorkItems = prWorkItems;
    }

    return releaseInfo;
  }

  private async getBuildWorkItems(project: IProjectInfo, build: Build) {
    const buildClient = getClient(BuildRestClient);
    const workItemRefs = await buildClient.getBuildWorkItemsRefs(
      project.name,
      build.id
    );
    return workItemRefs;
  }

  private async getWorkItems(
    workItemRefs: ResourceRef[],
    organization: string,
    project: IProjectInfo
  ) {
    if (!workItemRefs || !workItemRefs.length) return [];
    const workClient = getClient(WorkItemTrackingRestClient);

    const workItems = (
      await workClient.getWorkItems(
        workItemRefs.map((w) => Number.parseInt(w.id))
      )
    ).map((wi) => ({
      ...wi,
      html: `https://dev.azure.com/${organization}/${project.name}/_workitems/edit/${wi.id}`,
    }));
    return workItems;
  }

  private async getPr(project: IProjectInfo, build: Build) {
    const gitClient = getClient(GitRestClient);

    const commit = await gitClient.getCommit(
      build.sourceVersion,
      build.repository.id
    );

    const { prId, prName: name } = parseCommitMessage(commit.comment);

    if (!prId) return {};

    const pr = await gitClient.getPullRequest(
      build.repository.id,
      Number.parseInt(prId),
      project.name,
      undefined,
      undefined,
      undefined,
      undefined,
      true
    );
    (pr as any).webUrl = `${pr.repository.webUrl}/pullrequest/${pr.pullRequestId}`;
    return { pr, name };
  }

  private async getBuild(project: IProjectInfo, release: Release) {
    const buildArtifact = release.artifacts.find((a) => a.type === "Build");
    const buildId = (buildArtifact?.definitionReference as {
      version?: { id: string; name: string };
    })?.version?.id;

    if (!buildId) return undefined;
    const buildClient = getClient(BuildRestClient);

    const build = await buildClient.getBuild(
      project.name,
      Number.parseInt(buildId)
    );
    return build;
  }

  private async getRelease(project: IProjectInfo, releaseId: number) {
    const client: ReleaseRestClient = getClient(ReleaseRestClient);
    const release = await client.getRelease(project.name, releaseId);
    return release;
  }

  private async getReleasesAfter(project: IProjectInfo, release: Release) {
    const client: ReleaseRestClient = getClient(ReleaseRestClient);
    const releases = await client.getReleases(
      project.name,
      release.releaseDefinition.id,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      release.createdOn
    );
    return releases;
  }

  async getLinks(releaseData: ReleaseData): Promise<void> {
    const releaseApproval = releaseData.approval;
    const projectService = await SDK.getService<IProjectPageService>(
      CommonServiceIds.ProjectPageService
    );
    const project = await projectService.getProject();
    if (!project) return;

    const client: ReleaseRestClient = getClient(ReleaseRestClient);

    const deployments = await client.getDeployments(
      project.name,
      releaseApproval.releaseDefinition.id,
      undefined,
      undefined,
      undefined,
      undefined,
      DeploymentStatus.NotDeployed,
      DeploymentOperationStatus.Pending
    );
    const deployment = deployments.find(
      (d) =>
        d.release.id === releaseApproval.release.id &&
        d.releaseEnvironment.id === releaseApproval.releaseEnvironment.id
    );
    if (!deployment) return;

    releaseApproval.releaseDefinition._links =
      deployment.releaseDefinition._links;
    releaseApproval.release._links = deployment.release._links;
    releaseApproval.releaseEnvironment._links =
      deployment.releaseEnvironment._links;
  }
}

function parseCommitMessage(message: string) {
  const matches = new RegExp(
    "Merged PR (?<prId>[0-9]+):(?<prName>[^\\\\n]+)"
  ).exec(message);
  if (!matches)
    return {
      prId: undefined,
      prName: undefined,
    };
  const { groups } = (matches as unknown) as {
    groups: { prId: string; prName: string };
  };
  const { prId, prName } = groups;

  return {
    prId,
    prName,
  };
}
