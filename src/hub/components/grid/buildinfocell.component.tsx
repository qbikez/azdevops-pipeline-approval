import { ITableColumn, TwoLineTableCell } from "azure-devops-ui/Table";
import * as React from "react";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Link } from "azure-devops-ui/Link";
import { Icon } from "azure-devops-ui/Icon";

export function renderLastRunColumn(
  //   rowIndex: number,
  //   columnIndex: number,
  //   tableColumn: ITableColum`n<IPipelineItem>,
  //   tableItem: IPipelineItem
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<{}>,
  tableItem: unknown
): JSX.Element {
  const { prName, prId, releaseType, branchName } = {
    prName: "dupa",
    prId: 123,
    releaseType: ReleaseType.prAutomated,
    branchName: "default",
  };
  const text = "#" + prId + " \u00b7 " + prName;
  const releaseTypeText = ReleaseTypeText({ releaseType: releaseType });
  const tooltip = `${releaseTypeText} from ${branchName} branch`;
  return (
    <TwoLineTableCell
      className="bolt-table-cell-content-with-inline-link no-v-padding"
      key={"col-" + columnIndex}
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      line1={
        <span className="flex-row scroll-hidden">
          <Tooltip text={text} overflowOnly>
            <Link
              className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link"
              excludeTabStop
              href="#pr"
            >
              {text}
            </Link>
          </Tooltip>
        </span>
      }
      line2={
        <Tooltip text={tooltip} overflowOnly>
          <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
            {ReleaseTypeIcon({ releaseType: releaseType })}
            <span className="text-ellipsis" key="release-type-text">
              {releaseTypeText}
            </span>
            <Link
              className="monospaced-text text-ellipsis flex-row flex-center bolt-table-link bolt-table-inline-link"
              excludeTabStop
              href="#branch"
            >
              {Icon({
                className: "icon-margin",
                iconName: "OpenSource",
                key: "branch-name",
              })}
              {branchName}
            </Link>
          </span>
        </Tooltip>
      }
    />
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

export function ReleaseTypeText(props: { releaseType: ReleaseType }) {
  switch (props.releaseType) {
    case ReleaseType.prAutomated:
      return "PR Automated";
    case ReleaseType.manual:
      return "Manually triggered";
    case ReleaseType.scheduled:
      return "Scheduled";
    default:
      return "Release new-features";
  }
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
