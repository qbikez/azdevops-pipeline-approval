import * as React from "react";
import {
  ITableColumn,
  SimpleTableCell,
  TwoLineTableCell,
} from "azure-devops-ui/Table";
import { Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Link } from "azure-devops-ui/Link";
import { ReleaseRow, ReleaseData } from "./releaseapprovalgrid.component";
import { ExpandableTreeCell } from "azure-devops-ui/TreeEx";

export function renderGridPipelineCell(
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<ReleaseRow>,
  tableItem: ReleaseRow
): JSX.Element {
  const data = tableItem.underlyingItem.data;

  const approval = data.approval;
  if (!approval) {
    const release = data.release;
    const releaseLink =
      release._links && release._links.web ? release._links.web.href : "";

    return (
      <ExpandableTreeCell
        key={`col-pipeline-${columnIndex}-${rowIndex}`}
        columnIndex={columnIndex}
        treeItem={tableItem}
      >
        <Tooltip overflowOnly={true}>
          <span className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link">
            <Link href={releaseLink} target="_blank">
              <Status
                {...Statuses.Waiting}
                key="waiting"
                className="icon-large-margin"
                size={StatusSize.m}
              />
              {release.name}
            </Link>
          </span>
        </Tooltip>
      </ExpandableTreeCell>
    );
  }
  const definition = data.releaseDefinition;
  const link =
    definition._links && definition._links.web
      ? definition._links.web.href
      : "";
  const behind = data.info?.nextReleases?.length;

  return (
    <ExpandableTreeCell
      key={`col-pipeline-${columnIndex}-${rowIndex}`}
      columnIndex={columnIndex}
      treeItem={tableItem}
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
            {definition.name}
          </Link>
        </span>
      </Tooltip>
      <div className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
        {behind ? `${behind} behind` : ""}
      </div>
    </ExpandableTreeCell>
  );
}
