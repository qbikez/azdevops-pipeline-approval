import {
  ReleaseRestClient,
  ReleaseApproval,
  DeploymentStatus,
  DeploymentOperationStatus,
  BuildArtifactDownloadInput,
} from "azure-devops-extension-api/Release";

import { BuildRestClient } from "azure-devops-extension-api/Build";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import { GitRestClient } from "azure-devops-extension-api/Git";
import {
  IProjectPageService,
  CommonServiceIds,
} from "azure-devops-extension-api";
import { SDK, getClient } from "../mocks/sdkMock";
import { ReleaseApprovalRow } from "../components/grid/releaseapprovalgrid.component";

export class ReleaseService {
  async getWorkItems(releaseApproval: ReleaseApprovalRow) {
    try {
      const organization = SDK.getHost().name;
      const projectService = await SDK.getService<IProjectPageService>(
        CommonServiceIds.ProjectPageService
      );
      const project = await projectService.getProject();
      if (!project) return;

      const client: ReleaseRestClient = getClient(ReleaseRestClient);
      const release = await client.getRelease(
        project.name,
        releaseApproval.release.id
      );

      const buildArtifact = release.artifacts.find((a) => a.type === "Build");
      const buildId = (buildArtifact?.definitionReference as {
        version?: { id: string; name: string };
      })?.version?.id;

      if (!buildId) return;

      const buildClient = getClient(BuildRestClient);

      const build = await buildClient.getBuild(
        project.name,
        Number.parseInt(buildId)
      );

      releaseApproval.build = build;

      const gitClient = getClient(GitRestClient);

      const commit = await gitClient.getCommit(
        build.sourceVersion,
        build.repository.id
      );

      releaseApproval.gitCommit = commit;
      const { prId, prName } = parseCommitMessage(commit.comment);

      if (prId) {
        releaseApproval.prId = prId;
        releaseApproval.prName = prName;

        const pr = await gitClient.getPullRequestById(
          Number.parseInt(prId),
          project.name
        );

        releaseApproval.pr = pr;
      }

      const workItemRefs = await buildClient.getBuildWorkItemsRefs(
        project.name,
        Number.parseInt(buildId)
      );

      const workClient = getClient(WorkItemTrackingRestClient);

      const workItems = (
        await workClient.getWorkItems(
          workItemRefs.map((w) => Number.parseInt(w.id))
        )
      ).map((wi) => ({
        ...wi,
        html: `https://dev.azure.com/${organization}/${project.name}/_workitems/edit/${wi.id}`,
      }));

      releaseApproval.workItems = workItems;
    } catch (err) {
      console.error(err);
    }
  }

  async getLinks(releaseApproval: ReleaseApproval): Promise<void> {
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
