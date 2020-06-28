import { SDK, getClient } from "../mocks/sdkMock";
import {
  ReleaseRestClient,
  ApprovalStatus,
  EnvironmentStatus,
  ReleaseApproval,
} from "azure-devops-extension-api/Release";
import {
  IProjectPageService,
  CommonServiceIds,
} from "azure-devops-extension-api";
import { ReleaseData } from "../components/grid/releaseapprovalgrid.component";

export class ReleaseApprovalService {
  async findApprovals(
    top: number = 50,
    continuationToken: number = 0
  ): Promise<ReleaseData[]> {
    const projectService = await SDK.getService<IProjectPageService>(
      CommonServiceIds.ProjectPageService
    );
    const project = await projectService.getProject();
    const currentUser = SDK.getUser();
    if (!project) return [];
    let client: ReleaseRestClient = getClient(ReleaseRestClient);
    let approvals = await client.getApprovals(
      project.name,
      currentUser.id,
      undefined,
      undefined,
      undefined,
      top,
      continuationToken,
      undefined,
      true
    );
    return approvals.map((a) => ({
      releaseDefinition: a.releaseDefinition,
      release: a.release,
      id: a.id,
      approval: a,
    }));
  }

  private async scheduleDeployment(
    approval: ReleaseApproval,
    deferredDate: Date
  ): Promise<void> {
    const projectService = await SDK.getService<IProjectPageService>(
      CommonServiceIds.ProjectPageService
    );
    const project = await projectService.getProject();
    if (!project) return;
    let client: ReleaseRestClient = getClient(ReleaseRestClient);
    const updateMetadata = {
      scheduledDeploymentTime: deferredDate,
      comment: "",
      status: EnvironmentStatus.Undefined,
      variables: {},
    };
    await client.updateReleaseEnvironment(
      updateMetadata,
      project.name,
      approval.release.id,
      approval.releaseEnvironment.id
    );
  }

  private async changeStatus(
    approval: ReleaseApproval,
    approvalStatus: ApprovalStatus,
    comment: string
  ): Promise<void> {
    const projectService = await SDK.getService<IProjectPageService>(
      CommonServiceIds.ProjectPageService
    );
    const project = await projectService.getProject();
    if (!project) return;

    let client: ReleaseRestClient = getClient(ReleaseRestClient);
    approval.status = approvalStatus;
    approval.comments = comment;
    await client.updateReleaseApproval(approval, project.name, approval.id);
  }

  async approveAll(
    approvals: ReleaseApproval[],
    comment: string,
    deferredDate?: Date | null
  ): Promise<void> {
    approvals.forEach(
      async (approval: ReleaseApproval, index: number) =>
        await this.approve(approval, comment, deferredDate)
    );
  }

  async approve(
    approval: ReleaseApproval,
    comment: string,
    deferredDate?: Date | null
  ): Promise<void> {
    if (deferredDate) {
      await this.scheduleDeployment(approval, deferredDate);
    }
    await this.changeStatus(approval, ApprovalStatus.Approved, comment);
  }

  async rejectAll(
    approvals: ReleaseApproval[],
    comment: string
  ): Promise<void> {
    approvals.forEach(
      async (approval: ReleaseApproval, index: number) =>
        await this.reject(approval, comment)
    );
  }

  async reject(approval: ReleaseApproval, comment: string): Promise<void> {
    await this.changeStatus(approval, ApprovalStatus.Rejected, comment);
  }
}
