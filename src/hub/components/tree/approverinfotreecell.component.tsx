import * as React from "react";
import { TwoLineTableCell, ITableColumn, renderEmptyCell } from "azure-devops-ui/Table";
import { UserService } from "@src-root/hub/services/user.service";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Icon } from "azure-devops-ui/Icon";
import { Duration } from "azure-devops-ui/Duration";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { IApprovalTreeItem } from "./treeitem";
import { ITreeItemEx } from "azure-devops-ui/Utilities/TreeItemProvider";

export function renderGridApproverInfoTreeCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<ITreeItemEx<IApprovalTreeItem>>,
    tableItem: ITreeItemEx<IApprovalTreeItem>): JSX.Element {
    let hasChild = tableItem.underlyingItem.data.isParentElement === 1;
    return (<GridApproverInfoTreeCell
        key={`col-approver-${columnIndex}-${rowIndex}`}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        releaseApproval={tableItem.underlyingItem.data}
        hasChild={hasChild} />);
}

export interface IGridApproverInfoTreeCellProps {
    releaseApproval: IApprovalTreeItem;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<ITreeItemEx<IApprovalTreeItem>>;
    hasChild: boolean;
}

export default class GridApproverInfoTreeCell extends React.Component<IGridApproverInfoTreeCellProps> {

    private _userService: UserService = new UserService();

    constructor(props: IGridApproverInfoTreeCellProps) {
        super(props);
    }

    render(): JSX.Element {
        if (this.props.hasChild) return renderEmptyCell(this.props.rowIndex, this.props.columnIndex);
        const isLoggedUser = this._userService.isLoggedUser(this.props.releaseApproval.approverId);
        const isGroup = this.props.releaseApproval.isApproverContainer === 1;
        const iconName = isGroup ? "Group" : "Contact";
        const onBehalfText = `On behalf of ${this.props.releaseApproval.approver}`;
        return (
            <TwoLineTableCell
                columnIndex={this.props.columnIndex}
                tableColumn={this.props.tableColumn}
                key={`col-approver-${this.props.columnIndex}-${this.props.rowIndex}`}
                className="bolt-table-cell-content-with-inline-link no-v-padding"
                line1={
                    <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                        <ConditionalChildren renderChildren={!isLoggedUser}>
                            <Icon iconName={iconName} className="icon-margin" />
                            <span className="flex-row scroll-hidden">
                                <Tooltip text={onBehalfText} overflowOnly>
                                    <span>{onBehalfText}</span>
                                </Tooltip>
                            </span>
                        </ConditionalChildren>
                    </span>
                }
                line2={
                    <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                        <Icon iconName="Clock" className="icon-margin" />
                        Pending for&nbsp;
                        <Duration
                            startDate={new Date(this.props.releaseApproval.pendingFor)}
                            endDate={new Date()}
                        />
                    </span>
                } />
        );
    }
}