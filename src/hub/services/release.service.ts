import {
  ReleaseRestClient,
  ReleaseApproval,
  DeploymentStatus,
  DeploymentOperationStatus,
  BuildArtifactDownloadInput,
} from "azure-devops-extension-api/Release";

import { BuildRestClient } from "azure-devops-extension-api/Build";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import {
  IProjectPageService,
  CommonServiceIds,
} from "azure-devops-extension-api";
import { SDK, getClient } from "../mocks/sdkMock";

export class ReleaseService {
  async getWorkItems(releaseApproval: ReleaseApproval) {
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

    const workItemRefs = await buildClient.getBuildWorkItemsRefs(
      project.name,
      Number.parseInt(buildId)
    );

    const workClient = getClient(WorkItemTrackingRestClient);

    const workItems = await workClient.getWorkItems(
      workItemRefs.map((w) => Number.parseInt(w.id))
    );

    console.dir(workItems);
    return workItems;
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
