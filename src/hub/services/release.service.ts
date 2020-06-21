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

export class ReleaseService {
  async getWorkItems(releaseApproval: ReleaseApproval) {
    try {
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

      const gitClient = getClient(GitRestClient);

      const commit = await gitClient.getCommit(
        build.sourceVersion,
        build.repository.id
      );

      const workItemRefs = await buildClient.getBuildWorkItemsRefs(
        project.name,
        Number.parseInt(buildId)
      );

      const workClient = getClient(WorkItemTrackingRestClient);

      const workItems = await workClient.getWorkItems(
        workItemRefs.map((w) => Number.parseInt(w.id))
      );

      console.log(commit.author);
      console.log(commit.comment);
      return workItems;
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
