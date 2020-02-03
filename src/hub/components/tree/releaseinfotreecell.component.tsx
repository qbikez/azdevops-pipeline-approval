import * as React from "react";
import { TwoLineTableCell, ITableColumn, renderEmptyCell } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Icon } from "azure-devops-ui/Icon";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { Colors } from "@src-root/hub/model/Colors";
import { ApprovalType } from "azure-devops-extension-api/Release";
import { PillGroup } from "azure-devops-ui/PillGroup";
import { ITreeItemEx } from "azure-devops-ui/Utilities/TreeItemProvider";
import { IApprovalTreeItem } from "@src-root/hub/components/tree/treeitem";

export function renderGridReleaseInfoTreeCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<ITreeItemEx<IApprovalTreeItem>>,
    tableItem: ITreeItemEx<IApprovalTreeItem>): JSX.Element {
    let hasChild = tableItem.underlyingItem.data.isParentElement === 1;
    return (<GridReleaseInfoTreeCell
        key={`col-release-${columnIndex}-${rowIndex}`}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        releaseApproval={tableItem.underlyingItem.data}
        hasChild={hasChild} />);
}

export interface IGridReleaseInfoTreeCellProps {
    releaseApproval: IApprovalTreeItem;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<ITreeItemEx<IApprovalTreeItem>>;
    hasChild: boolean;
}

export default class GridReleaseInfoTreeCell extends React.Component<IGridReleaseInfoTreeCellProps> {

    constructor(props: IGridReleaseInfoTreeCellProps) {
        super(props);
    }

    render(): JSX.Element {
        if (this.props.hasChild) return renderEmptyCell(this.props.rowIndex, this.props.columnIndex);
        const releaseName = this.props.releaseApproval.release;
        const environmentName = this.props.releaseApproval.environment;
        const approvalType = this.props.releaseApproval.approvalType;

        let approvalTypeLabel: string = '';
        switch (approvalType) {
            case ApprovalType.PreDeploy:
                approvalTypeLabel = 'Pre-Deployment';
                break;
            case ApprovalType.PostDeploy:
                approvalTypeLabel = 'Post-Deployment';
                break;
        }

        return (
            <TwoLineTableCell
                columnIndex={this.props.columnIndex}
                tableColumn={this.props.tableColumn}
                key={`col-release-${this.props.columnIndex}-${this.props.rowIndex}`}
                className="bolt-table-cell-content-with-inline-link no-v-padding"
                line1={
                    <span className="flex-row scroll-hidden">
                        <Tooltip text={releaseName} overflowOnly>
                            <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                                <Icon iconName="ProductRelease" />
                                {releaseName}
                            </span>
                        </Tooltip>
                    </span>
                }
                line2={
                    <Tooltip text={environmentName} overflowOnly>
                        <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                            <PillGroup className="flex-row">
                                <Pill
                                    size={PillSize.compact}
                                    variant={PillVariant.colored}
                                    color={Colors.darkRedColor}>
                                    <Icon iconName="ServerEnviroment" className="icon-margin" />
                                    {environmentName}
                                </Pill>
                                <Pill
                                    size={PillSize.compact}
                                    variant={PillVariant.outlined}>
                                    {approvalTypeLabel}
                                </Pill>
                            </PillGroup>
                        </span>
                    </Tooltip>
                } />
        );
    }
}