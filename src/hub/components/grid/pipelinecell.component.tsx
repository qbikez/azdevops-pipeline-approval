import * as React from "react";
import {
  ITableColumn,
  SimpleTableCell,
  TwoLineTableCell,
} from "azure-devops-ui/Table";
import { Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Link } from "azure-devops-ui/Link";
import {
  ReleaseApprovalRow,
  ReleaseApprovalEx,
} from "./releaseapprovalgrid.component";
import { ExpandableTreeCell } from "azure-devops-ui/TreeEx";

export function renderGridPipelineCell(
  rowIndex: number,
  columnIndex: number,
  _tableColumn: ITableColumn<ReleaseApprovalRow>,
  tableItem: ReleaseApprovalRow
): JSX.Element {
  const approval: ReleaseApprovalEx = tableItem.underlyingItem.data;
  const releaseDefinition = approval.releaseDefinition;
  const releaseDefinitionName = releaseDefinition.name;
  const link =
    releaseDefinition._links && releaseDefinition._links.web
      ? releaseDefinition._links.web.href
      : "";
  const behind = approval.info?.nextReleases?.length;

  return (
    <ExpandableTreeCell
      columnIndex={columnIndex}
      treeItem={tableItem}
      key={`col-pipeline-${columnIndex}-${rowIndex}`}
    >
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
      <div className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
        {behind ? `${behind} behind` : ""}
      </div>
    </ExpandableTreeCell>
  );
}
