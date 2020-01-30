import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { Table, ITableColumn, ColumnSelect, renderSimpleCell, ISimpleTableCell } from "azure-devops-ui/Table";
import { ObservableArray, ObservableValue, IReadonlyObservableValue } from "azure-devops-ui/Core/Observable";
import { ReleaseApprovalService } from "@src-root/hub/services/release-approval.service";
import { ListSelection } from "azure-devops-ui/List";
import { CommonServiceIds, IGlobalMessagesService } from "azure-devops-extension-api";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ISelectionRange } from "azure-devops-ui/Utilities/Selection";
import { ReleaseApprovalAction } from "@src-root/hub/model/ReleaseApprovalAction";
import { ReleaseApprovalEvents, EventType } from "@src-root/hub/model/ReleaseApprovalEvents";
import { renderGridPipelineCell } from "@src-root/hub/components/grid/pipelinecell.component";
import { renderGridReleaseInfoCell } from "@src-root/hub/components/grid/releaseinfocell.component";
import { renderGridApproverInfoCell } from "@src-root/hub/components/grid/approverinfocell.component";
import { renderGridActionsCell } from "@src-root/hub/components/grid/actionscell.component";
import { Card } from "azure-devops-ui/Card";
import { ReleaseApproval, Release } from "azure-devops-extension-api/Release";
import { Button } from "azure-devops-ui/Button";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import ReleaseApprovalForm from "@src-root/hub/components/form/form.component";

import { Tree, ITreeColumn } from "azure-devops-ui/TreeEx";
import { ITreeItemProvider, ITreeItemEx, ITreeItem, TreeItemProvider } from "azure-devops-ui/Utilities/TreeItemProvider";
import { renderExpandableTreeCell, renderTreeCell } from "azure-devops-ui/TreeEx";

export interface IApprovalTreeItem extends ISimpleTableCell {
    id: any;
    name: string;
}

export default class ReleaseApprovalTree extends React.Component {

    private _releaseService: ReleaseApprovalService = new ReleaseApprovalService();
    private _itemProvider: ITreeItemProvider<IApprovalTreeItem>;


    constructor(props: {}) {
        super(props);
        this._itemProvider = new TreeItemProvider<IApprovalTreeItem>([]);
    }

    private _treeColumns: ITreeColumn<IApprovalTreeItem>[] = [
        {
            id: "name",
            name: "Release",
            renderCell: renderTreeCell,
            width: 200
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
            let parent = this._itemProvider.roots.find((item) => item.data.name == approval.releaseEnvironment.name);
            if (!!!parent) {
                parent = {
                    childItems: [],
                    data: { id: approval.releaseEnvironment.id, name: approval.releaseEnvironment.name },
                    expanded: true
                };
                this._itemProvider.add(parent);
            }

            this._itemProvider.add({
                childItems: [],
                data: { id: approval.id, name: approval.release.name },
                expanded: false
            }, parent);
        });
    }
}