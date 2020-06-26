import {
  ITableColumn,
  TwoLineTableCell,
  SimpleTableCell,
} from "azure-devops-ui/Table";
import * as React from "react";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Link } from "azure-devops-ui/Link";
import { Icon } from "azure-devops-ui/Icon";
import { ReleaseApprovalRow } from "./releaseapprovalgrid.component";
import {
  List,
  SimpleList,
  IListItemDetails,
  ListItem,
} from "azure-devops-ui/List";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { WorkItem } from "azure-devops-extension-api/WorkItemTracking";

export function renderWorkItemsColumn(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<ReleaseApprovalRow>,
  tableItem: ReleaseApprovalRow
): JSX.Element {
  return (
    <SimpleTableCell
      className="bolt-table-cell-content-with-inline-link no-v-padding"
      key={"col-" + columnIndex}
      columnIndex={columnIndex}
      tableColumn={tableColumn}
    >
      <List
        itemProvider={new ArrayItemProvider(tableItem.prWorkItems || [])}
        renderRow={renderTaskRow}
      />
    </SimpleTableCell>
  );
}

function ReleaseTypeIcon(props: { releaseType: ReleaseType }) {
  let iconName: string = "";
  switch (props.releaseType) {
    case ReleaseType.prAutomated:
      iconName = "BranchPullRequest";
      break;
    default:
      iconName = "Tag";
  }

  return Icon({
    className: "bolt-table-inline-link-left-padding icon-margin",
    iconName: iconName,
    key: "release-type",
  });
}

enum PipelineStatus {
  running = "running",
  succeeded = "succeeded",
  failed = "failed",
  warning = "warning",
}

export enum ReleaseType {
  prAutomated,
  tag,
  scheduled,
  manual,
}

interface IPipelineLastRun {
  startTime?: Date;
  endTime?: Date;
  prId: number;
  prName: string;
  releaseType: ReleaseType;
  branchName: string;
}

export interface IPipelineItem {
  name: string;
  status: PipelineStatus;
  lastRunData: IPipelineLastRun;
  //favorite: ObservableValue<boolean>;
}

interface IStatusIndicatorData {
  //statusProps: IStatusProps;
  label: string;
}

const renderTaskRow = (
  index: number,
  item: WorkItem,
  details: IListItemDetails<WorkItem>,
  key?: string
): JSX.Element => {
  return (
    <ListItem key={key || "list-item" + index} index={index} details={details}>
      <Link href={(item as any).html}>
        {item.id} {item.fields["System.Title"]}
      </Link>
    </ListItem>
  );
};
