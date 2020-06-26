import * as React from "react";
import {
  ITableColumn,
  SimpleTableCell,
  TwoLineTableCell,
} from "azure-devops-ui/Table";
import { Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ReleaseApproval } from "azure-devops-extension-api/Release";
import { Link } from "azure-devops-ui/Link";
import { ReleaseApprovalRow } from "./releaseapprovalgrid.component";
import { tableProperties } from "office-ui-fabric-react";

export function renderGridPipelineCell(
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<ReleaseApprovalRow>,
  tableItem: ReleaseApprovalRow
): JSX.Element {
  const approval: ReleaseApproval = tableItem;
  return (
    <GridPipelineCell
      key={`col-pipeline-${columnIndex}-${rowIndex}`}
      rowIndex={rowIndex}
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      releaseApproval={approval}
    />
  );
}

export interface IGridPipelineCellProps {
  releaseApproval: ReleaseApprovalRow;
  rowIndex: number;
  columnIndex: number;
  tableColumn: ITableColumn<ReleaseApprovalRow>;
}

export default class GridPipelineCell extends React.Component<
  IGridPipelineCellProps
> {
  constructor(props: IGridPipelineCellProps) {
    super(props);
  }

  render(): JSX.Element {
    const releaseDefinition = this.props.releaseApproval.releaseDefinition;
    const releaseDefinitionName = releaseDefinition.name;
    const link =
      releaseDefinition._links && releaseDefinition._links.web
        ? releaseDefinition._links.web.href
        : "";
    const behind = this.props.releaseApproval.info?.nextReleases?.length;
    return (
      <TwoLineTableCell<ReleaseApprovalRow>
        columnIndex={this.props.columnIndex}
        tableColumn={this.props.tableColumn}
        key={`col-pipeline-${this.props.columnIndex}-${this.props.rowIndex}`}
        // contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m scroll-hidden"
        line1={
          <Tooltip overflowOnly={true}>
            <span className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link">
              <Link href={link} target="_blank">
                <Status
                  {...Statuses.Waiting}
                  key="waiting"
                  className="icon-large-margin"
                  size={StatusSize.m}
                />
                {releaseDefinitionName}
              </Link>
            </span>
          </Tooltip>
        }
        line2={
          <div class="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
            {behind ? `${behind} behind` : ""}
          </div>
        }
      />
    );
  }
}
