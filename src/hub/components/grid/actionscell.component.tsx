import * as React from "react";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Button } from "azure-devops-ui/Button";
import {
  ReleaseApprovalEvents,
  EventType,
} from "@src-root/hub/model/ReleaseApprovalEvents";
import { ReleaseApproval } from "azure-devops-extension-api/Release";
import { ReleaseRow, ReleaseData } from "./releaseapprovalgrid.component";

export function renderGridActionsCell(
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<ReleaseRow>,
  tableItem: ReleaseRow
): JSX.Element {
  const data: ReleaseData = tableItem.underlyingItem.data;
  const approval = data.approval;
  if (!approval) {
    return (
      <SimpleTableCell
        key={`col-actions-${columnIndex}-${rowIndex}`}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
      ></SimpleTableCell>
    );
  }
  return (
    <SimpleTableCell
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      key={`col-actions-${columnIndex}-${rowIndex}`}
    >
      <ButtonGroup>
        <Button
          key={"btn-approve-" + approval.id}
          tooltipProps={{ text: "Approve" }}
          primary={true}
          iconProps={{ iconName: "CheckMark" }}
          onClick={() =>
            ReleaseApprovalEvents.fire(EventType.ApproveSingleRelease, approval)
          }
        />
        <Button
          key={"btn-reject-" + approval.id}
          tooltipProps={{ text: "Reject" }}
          danger={true}
          iconProps={{ iconName: "Cancel" }}
          onClick={() =>
            ReleaseApprovalEvents.fire(EventType.RejectSingleRelease, approval)
          }
        />
      </ButtonGroup>
    </SimpleTableCell>
  );
}
