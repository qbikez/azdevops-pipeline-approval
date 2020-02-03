import { ISimpleTableCell } from "azure-devops-ui/Table";
import { ISimpleListCell } from "azure-devops-ui/List";

export interface IApprovalTreeItem extends ISimpleTableCell {
    id: string | number,
    firstColumn: string | ISimpleListCell;
    isParentElement: number,
    definition: string;
    release: string;
    environment: string;
    approvalType: number;
    pendingFor: number;
    approver: string;
    approverId: string;
    isApproverContainer: number;
}