import * as React from "react";
import { ReleaseApprovalService } from "@src-root/hub/services/release-approval.service";
import { Tree, ITreeColumn } from "azure-devops-ui/TreeEx";
import { ITreeItemProvider, ITreeItemEx, TreeItemProvider } from "azure-devops-ui/Utilities/TreeItemProvider";
import { renderExpandableTreeCell } from "azure-devops-ui/TreeEx";
import { IApprovalTreeItem } from "@src-root/hub/components/tree/treeitem";
import {renderGridReleaseInfoTreeCell} from "@src-root/hub/components/tree/releaseinfotreecell.component";
import { renderGridApproverInfoTreeCell } from "@src-root/hub/components/tree/approverinfotreecell.component";
import { renderGridActionsTreeCell } from "./actionstreecell.component";

export default class ReleaseApprovalTree extends React.Component {

    private _releaseService: ReleaseApprovalService = new ReleaseApprovalService();
    private _itemProvider: ITreeItemProvider<IApprovalTreeItem>;


    constructor(props: {}) {
        super(props);
        this._itemProvider = new TreeItemProvider<IApprovalTreeItem>([]);
    }

    private _treeColumns: ITreeColumn<IApprovalTreeItem>[] = [
        {
            id: "firstColumn",
            name: "Release",
            renderCell: renderExpandableTreeCell,
            width: 250
        },
        {
            id: "releaseInfo",
            name: "",
            renderCell: renderGridReleaseInfoTreeCell,
            width: -40
        },
        {
            id: "approverInfo",
            name: "Approval Status",
            renderCell: renderGridApproverInfoTreeCell,
            width: -60
        },
        {
            id: "actions",
            renderCell: renderGridActionsTreeCell,
            width: 150
        }
    ];

    render(): JSX.Element {
        this.loadData();
        return (
            <div className="flex-row" style={{ height: "400px" }}>
                <Tree<IApprovalTreeItem>
                    columns={this._treeColumns}
                    itemProvider={this._itemProvider}
                    onToggle={(event, treeItem: ITreeItemEx<IApprovalTreeItem>) => {
                        this._itemProvider.toggle(treeItem.underlyingItem);
                    }}
                    scrollable={true}
                />
            </div>
        );
    }

    private loadData = async () => {
        const approvals = await this._releaseService.findApprovals(10, undefined);
        approvals.forEach(approval => {
            let parent = this._itemProvider.roots.find((item) => item.data.id == approval.releaseEnvironment.name);
            if (!!!parent) {
                parent = {
                    childItems: [],
                    data: { 
                        id: approval.releaseEnvironment.name,
                        isParentElement: 1,
                        firstColumn: { 
                            iconProps: { 
                                iconName: "ServerEnviroment" 
                            }, 
                            text: approval.releaseEnvironment.name
                        }, 
                        definition: '',
                        release: '',
                        environment: '',
                        approvalType: 0,
                        pendingFor: 0,
                        approver: '',
                        approverId: '',
                        isApproverContainer: 0
                    },
                    expanded: false
                };
                this._itemProvider.add(parent);
            }

            this._itemProvider.add({
                data: { 
                    id: approval.id,
                    isParentElement: 0,
                    firstColumn: { iconProps: { iconName: "Clock" }, text: approval.releaseDefinition.name }, 
                    definition: approval.releaseDefinition.name,
                    release: approval.release.name,
                    environment: approval.releaseEnvironment.name,
                    approvalType: approval.approvalType,
                    pendingFor: approval.createdOn.getTime(),
                    approver: approval.approver.displayName,
                    approverId: approval.approver.id,
                    isApproverContainer: approval.approver.isContainer ? 1 : 0
                },
                expanded: false
            }, parent);
        });
    }
}