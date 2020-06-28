import * as React from "react";
import {
  TwoLineTableCell,
  ITableColumn,
  SimpleTableCell,
} from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Icon } from "azure-devops-ui/Icon";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { Colors } from "@src-root/hub/model/Colors";
import {
  ReleaseApproval,
  ApprovalType,
  ReleaseEnvironmentShallowReference,
} from "azure-devops-extension-api/Release";
import { PillGroup } from "azure-devops-ui/PillGroup";
import { Link } from "azure-devops-ui/Link";
import { ReleaseRow, ReleaseData } from "./releaseapprovalgrid.component";

export function renderGridReleaseInfoCell(
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<ReleaseRow>,
  tableItem: ReleaseRow
): JSX.Element {
  const data: ReleaseData = tableItem.underlyingItem.data;

  const approval = data.approval;
  const release = data.release;
  const releaseName = release.name;
  const releaseLink =
    release._links && release._links.web ? release._links.web.href : "";

  const environment = data.releaseEnvironment;
  const link = environment?._links?.web?.href || "";

  const approvalType = approval?.approvalType;

  let approvalTypeLabel: string = "";
  switch (approvalType) {
    case ApprovalType.PreDeploy:
      approvalTypeLabel = "Pre-Deployment";
      break;
    case ApprovalType.PostDeploy:
      approvalTypeLabel = "Post-Deployment";
      break;
  }

  return (
    <TwoLineTableCell
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      key={`col-release-${columnIndex}-${rowIndex}`}
      className="bolt-table-cell-content-with-inline-link no-v-padding"
      line1={
        <span className="flex-row scroll-hidden">
          <Tooltip text={releaseName} overflowOnly>
            <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
              <Link href={releaseLink} target="_blank">
                <Icon iconName="ProductRelease" />
                {releaseName}
              </Link>
            </span>
          </Tooltip>
        </span>
      }
      line2={
        environment ? (
          <Tooltip text={environment?.name} overflowOnly>
            <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
              <PillGroup className="flex-row">
                <Pill
                  size={PillSize.compact}
                  variant={PillVariant.colored}
                  color={Colors.darkRedColor}
                  onClick={() => {
                    if (link) {
                      window.open(link, "_blank");
                    }
                  }}
                >
                  <Icon iconName="ServerEnviroment" className="icon-margin" />
                  {environment?.name}
                </Pill>
                {approvalTypeLabel ? (
                  <Pill size={PillSize.compact} variant={PillVariant.outlined}>
                    {approvalTypeLabel}
                  </Pill>
                ) : (
                  ""
                )}
              </PillGroup>
            </span>
          </Tooltip>
        ) : (
          <div></div>
        )
      }
    />
  );
}
