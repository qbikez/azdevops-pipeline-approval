import * as React from "react";
import { ITableColumn, SimpleTableCell, renderEmptyCell } from "azure-devops-ui/Table";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Button } from "azure-devops-ui/Button";
import { ReleaseApprovalEvents, EventType } from "@src-root/hub/model/ReleaseApprovalEvents";
import { IApprovalTreeItem } from "./treeitem";
import { ITreeItemEx } from "azure-devops-ui/Utilities/TreeItemProvider";

export function renderGridActionsTreeCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<ITreeItemEx<IApprovalTreeItem>>,
    tableItem: ITreeItemEx<IApprovalTreeItem>): JSX.Element {
    let hasChild = tableItem.underlyingItem.data.isParentElement === 1;
    return (<GridActionsTreeCell
        key={`col-actions-${columnIndex}-${rowIndex}`}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        releaseApproval={tableItem.underlyingItem.data}
        hasChild={hasChild} />);
}

export interface IGridActionsTreeCellProps {
    releaseApproval: IApprovalTreeItem;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<ITreeItemEx<IApprovalTreeItem>>;
    hasChild: boolean;
}

export default class GridActionsTreeCell extends React.Component<IGridActionsTreeCellProps> {

    constructor(props: IGridActionsTreeCellProps) {
        super(props);
    }

    render(): JSX.Element {
        if (this.props.hasChild) return renderEmptyCell(this.props.rowIndex, this.props.columnIndex);
        return (
            <SimpleTableCell
                columnIndex={this.props.columnIndex}
                tableColumn={this.props.tableColumn}
                key={`col-actions-${this.props.columnIndex}-${this.props.rowIndex}`}>
                <ButtonGroup>
                    <Button
                        key={"btn-approve-" + this.props.releaseApproval.id}
                        tooltipProps={{ text: "Approve" }}
                        primary={true}
                        iconProps={{ iconName: "CheckMark" }}
                        onClick={() => ReleaseApprovalEvents.fire(EventType.ApproveSingleRelease, this.props.releaseApproval)} />
                    <Button
                        key={"btn-reject-" + this.props.releaseApproval.id}
                        tooltipProps={{ text: "Reject" }}
                        danger={true}
                        iconProps={{ iconName: "Cancel" }}
                        onClick={() => ReleaseApprovalEvents.fire(EventType.RejectSingleRelease, this.props.releaseApproval)} />
                </ButtonGroup>
            </SimpleTableCell>
        );
    }
}