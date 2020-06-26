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
import { PillSize, Pill, PillVariant } from "azure-devops-ui/Pill";
import { PillGroup } from "azure-devops-ui/PillGroup";
import { StatusSize, Status, Statuses } from "azure-devops-ui/Status";
import { Colors } from "@src-root/hub/model/Colors";

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
        itemProvider={new ArrayItemProvider(tableItem.info?.prWorkItems || [])}
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
  const state = item.fields["System.State"];
  let stateColor = "neutral";
  switch (state) {
    case "In Progress":
    case "Checked-In":
    case "In QA":
      stateColor = "active";
      break;
    case "Live":
    case "Done":
      stateColor = "success";
      break;
  }

  return (
    <ListItem key={key || "list-item" + index} index={index} details={details}>
      <div
        style={{ marginLeft: "10px", padding: "10px 0px" }}
        className="flex-column h-scroll-hidden"
      >
        <span className="text-ellipsis">
          <Link
            className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link"
            excludeTabStop
            href={(item as any).html}
          >
            {item.id} {item.fields["System.Title"]}
          </Link>
        </span>
        <span className="fontSizeMS font-size-ms text-ellipsis secondary-text">
          <PillGroup className="flex-row">
            <Pill size={PillSize.compact}>
              QA: {item.fields["Custom.QA"] || "?"}
            </Pill>
            <Status
              size={StatusSize.s}
              color={stateColor}
              onRenderIcon={(className, size, animated, ariaLabel) => {
                return React.createElement(
                  Svg,
                  {
                    ariaLabel: ariaLabel,
                    className,
                    size,
                    viewBox: "0 0 12 12",
                    "vertical-align": "middle",
                  },
                  React.createElement("circle", { cx: "6", cy: "6", r: "6" })
                );
              }}
            />
            {state}
          </PillGroup>
        </span>

        {console.dir(item)}
      </div>
    </ListItem>
  );
};

function Svg(props: any) {
  var role = props.ariaLabel ? "img" : "presentation";
  //var descId = props.ariaLabel ? getSafeId("status-" + statusId++ + "-desc") : undefined;
  return React.createElement(
    "svg",
    {
      className: props.className,
      height: props.size,
      role: role,
      viewBox: props.viewBox,
      width: props.size,
      xmlns: "http://www.w3.org/2000/svg",
    },
    props.ariaLabel && React.createElement("desc", {}, props.ariaLabel),
    props.children
  );
}
