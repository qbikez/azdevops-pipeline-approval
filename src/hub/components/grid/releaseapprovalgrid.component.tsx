import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { Tree, ITreeColumn } from "azure-devops-ui/TreeEx";
import {
  ObservableValue,
  IReadonlyObservableArray,
  ObservableArray,
} from "azure-devops-ui/Core/Observable";
import { ReleaseApprovalService } from "@src-root/hub/services/release-approval.service";
import { ListSelection } from "azure-devops-ui/List";
import {
  CommonServiceIds,
  IGlobalMessagesService,
} from "azure-devops-extension-api";
import {
  ArrayItemProvider,
  IItemProvider,
} from "azure-devops-ui/Utilities/Provider";
import { ISelectionRange } from "azure-devops-ui/Utilities/Selection";
import {
  ReleaseApprovalAction,
  ActionType,
} from "@src-root/hub/model/ReleaseApprovalAction";
import {
  ReleaseApprovalEvents,
  EventType,
} from "@src-root/hub/model/ReleaseApprovalEvents";
import { renderGridPipelineCell } from "@src-root/hub/components/grid/pipelinecell.component";
import { renderGridReleaseInfoCell } from "@src-root/hub/components/grid/releaseinfocell.component";
import { renderGridApproverInfoCell } from "@src-root/hub/components/grid/approverinfocell.component";
import { renderGridActionsCell } from "@src-root/hub/components/grid/actionscell.component";
import { Card } from "azure-devops-ui/Card";
import {
  ReleaseApproval,
  Release,
  ReleaseShallowReference,
  ReleaseDefinition,
  ReleaseDefinitionShallowReference,
  ReleaseEnvironmentShallowReference,
} from "azure-devops-extension-api/Release";
import { Button } from "azure-devops-ui/Button";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import ReleaseApprovalForm from "@src-root/hub/components/form/form.component";
import {
  ReleaseService,
  ReleaseInfo,
} from "@src-root/hub/services/release.service";
import { renderLastRunColumn } from "./buildinfocell.component";
import { renderWorkItemsColumn } from "./workitemscell.component";
import {
  ITreeItemEx,
  ITreeItem,
  TreeItemProvider,
  ITreeItemProvider,
} from "azure-devops-ui/Utilities/TreeItemProvider";

export type ReleaseData = {
  id: number;
  release: ReleaseShallowReference;
  releaseDefinition: ReleaseDefinitionShallowReference;
  releaseEnvironment: ReleaseEnvironmentShallowReference;
  approval?: ReleaseApproval;
  info?: ReleaseInfo;
  parent?: ReleaseData;
  children?: ReleaseData[];
};

export type ReleaseRow = ITreeItemEx<ReleaseData>;

export default class ReleaseApprovalGrid extends React.Component {
  private _approvalsService: ReleaseApprovalService = new ReleaseApprovalService();
  private _releaseService: ReleaseService = new ReleaseService();
  private _treeItemProvider = new ItemProvider();
  private _pageLength: number = 2;
  private _hasMoreItems: ObservableValue<boolean> = new ObservableValue<
    boolean
  >(false);
  private _selection: ListSelection = new ListSelection({
    selectOnFocus: false,
    multiSelect: true,
  });
  private _selectedReleases: ArrayItemProvider<
    ReleaseData
  > = new ArrayItemProvider<ReleaseData>([]);
  private _approvalForm: React.RefObject<ReleaseApprovalForm>;

  private get dialog() {
    return this._approvalForm.current as ReleaseApprovalForm;
  }
  private _action: ObservableValue<ReleaseApprovalAction> = new ObservableValue<
    ReleaseApprovalAction
  >(ReleaseApprovalAction.Reject);

  private _configureGridColumns(): ITreeColumn<ReleaseData>[] {
    return [
      {
        id: "pipeline",
        name: "Release",
        renderCell: renderGridPipelineCell,
        width: 250,
      },
      {
        id: "releaseInfo",
        renderCell: renderGridReleaseInfoCell,
        width: 200,
      },
      {
        id: "buildInfo",
        name: "Pull Request",
        renderCell: renderLastRunColumn,
        width: -60,
      },
      {
        id: "workItems",
        name: "Work Items",
        renderCell: renderWorkItemsColumn,
        width: -60,
      },
      {
        id: "approverInfo",
        name: "Approval Status",
        renderCell: renderGridApproverInfoCell,
        width: -30,
      },
      {
        id: "actions",
        renderCell: renderGridActionsCell,
        width: 150,
      },
    ];
  }

  constructor(props: {}) {
    super(props);
    this._approvalForm = React.createRef();
    this.subscribeEvents();
  }

  private subscribeEvents(): void {
    ReleaseApprovalEvents.subscribe(EventType.RefreshGrid, async () => {
      await this.refreshGrid();
    });
    ReleaseApprovalEvents.subscribe(EventType.ClearGridSelection, () => {
      this._selectedReleases = new ArrayItemProvider<ReleaseData>([]);
    });
    ReleaseApprovalEvents.subscribe(EventType.ApproveAllReleases, async () => {
      await this.approveAll();
    });
    ReleaseApprovalEvents.subscribe(
      EventType.ForceRelease,
      async (data: ReleaseData) => {
        await this.forceRelease(data);
      }
    );

    ReleaseApprovalEvents.subscribe(
      EventType.ApproveSingleRelease,
      (approval: ReleaseData) => {
        this.approveSingle(approval);
      }
    );
    ReleaseApprovalEvents.subscribe(EventType.RejectAllReleases, async () => {
      await this.rejectAll();
    });
    ReleaseApprovalEvents.subscribe(
      EventType.RejectSingleRelease,
      (approval: ReleaseData) => {
        this.rejectSingle(approval);
      }
    );

    this._selection.subscribe(
      (selection: ISelectionRange[], action: string) => {
        ReleaseApprovalEvents.fire(
          EventType.GridRowSelectionChanged,
          selection,
          action,
          this._selection.selectedCount
        );
      }
    );
  }

  render(): JSX.Element {
    this.loadData();
    return (
      <div className="flex-grow">
        <div>
          <Card
            className="flex-grow bolt-table-card"
            contentProps={{ contentPadding: false }}
          >
            <Tree<ReleaseData>
              columns={this._configureGridColumns()}
              itemProvider={this._treeItemProvider}
              selection={this._selection}
              onToggle={(event, treeItem: ITreeItemEx<ReleaseData>) => {
                this._treeItemProvider.toggle(treeItem);
              }}
              scrollable={true}
            />
          </Card>
          <ConditionalChildren renderChildren={this._hasMoreItems}>
            <div style={{ marginTop: "10px" }}>
              <Button onClick={this.loadData} text="Load more..." />
            </div>
          </ConditionalChildren>
          <ReleaseApprovalForm
            ref={this._approvalForm}
            action={this._action}
            onConfirm={this.confirmAction}
          />
        </div>
      </div>
    );
  }

  private loadData = async () => {
    let continuationToken = 0;
    const rootRows = this._treeItemProvider.value.filter((r) => r.depth === 0);
    const lastIndex = rootRows.length - 1;
    if (lastIndex >= 0) {
      const lastItem = rootRows[lastIndex].underlyingItem.data;
      continuationToken = lastItem.id - 1;
    }
    const rowShimmer = this.getRowShimmer()[0];
    this._treeItemProvider.add(rowShimmer);
    const approvals: ReleaseData[] = await this._approvalsService.findApprovals(
      this._pageLength,
      continuationToken
    );
    const promises = approvals.map(async (a) => {
      await this._releaseService.getLinks(a);
    });
    await Promise.all(promises);

    await Promise.all(
      approvals.map(async (a) => {
        const info = await this._releaseService.getReleaseInfo(
          a.release.id,
          true
        );
        a.info = info;
      })
    );
    this._hasMoreItems.value = this._pageLength == approvals.length;
    // remove shimmer
    this._treeItemProvider.pop();

    const notInTable = approvals.filter((a) =>
      this._treeItemProvider.value.every(
        (x) => x.underlyingItem?.data?.id !== a.id
      )
    );
    const rows = await Promise.all(
      notInTable.map(async (a) => {
        const row = toTreeItem(a);
        if (a.info?.nextReleases)
          row.childItems = this.getRowShimmer(a.info?.nextReleases.length);
        return row;
      })
    );
    const treeNodes = rows.map((r) => this._treeItemProvider.add(r));

    treeNodes.forEach(async (n) => {
      const a = n.underlyingItem.data;
      const nextRows =
        a.info?.nextReleases?.map(async (next) => {
          const info = await this._releaseService.getReleaseInfo(next.id);
          const environment =
            a.releaseEnvironment ||
            info.release?.environments.find(
              (e) => e.name === a.releaseEnvironment?.name
            );
          const child: ReleaseData = {
            id: a.id,
            info,
            release: info.release!,
            releaseDefinition: info.release!.releaseDefinition,
            parent: n.underlyingItem.data,
            releaseEnvironment: environment,
          };
          const childRow = toTreeItem(child);
          n.underlyingItem.childItems?.push(childRow);
          return childRow;
        }) || [];
      const children = await Promise.all(nextRows);
      n.underlyingItem.childItems = children;
      n.underlyingItem.data.children = children.map((c) => c.data);
      this._treeItemProvider.refresh(n);
    });
  };

  private getRowShimmer(length: number = 1): any[] {
    return new Array(length).fill(
      new ObservableValue<ReleaseApproval | undefined>(undefined)
    );
  }

  async refreshGrid(): Promise<void> {
    this._treeItemProvider.removeAll();
    await this.loadData();
  }

  private approveSingle(approval: ReleaseData): void {
    console.log(`approve single ${approval}`);
    this._selectedReleases = new ArrayItemProvider<ReleaseData>([approval]);
    this.approve();
  }

  async approveAll(): Promise<void> {
    if (this._selection.value.length == 0) {
      await this.showErrorMessage(
        "You need to select at least one release to Approve."
      );
      return;
    }
    this.getSelectedReleases();
    this.approve();
  }

  private approve(): void {
    this._action.value = ReleaseApprovalAction.Approve;
    this.dialog.openDialog(this._selectedReleases);
  }

  private rejectSingle(approval: ReleaseData): void {
    this._selectedReleases = new ArrayItemProvider<ReleaseData>([approval]);
    this.reject();
  }

  async rejectAll(): Promise<void> {
    if (this._selection.value.length == 0) {
      await this.showErrorMessage(
        "You need to select at least one release to Reject."
      );
      return;
    }
    this.getSelectedReleases();
    this.reject();
  }

  private reject(): void {
    this._action.value = ReleaseApprovalAction.Reject;
    this.dialog.openDialog(this._selectedReleases);
  }

  private forceRelease(data: ReleaseData) {
    if (!data.info?.release) throw "missing release info";
    if (!data.parent) throw "missing parent approval";
    if (!data.parent.children) throw "missing siblings";

    const childIndex = data.parent.children.indexOf(data);
    console.log(`index:${childIndex}`);
    const toCancel = data.parent.children.slice(childIndex + 1);

    this._action.value = ReleaseApprovalAction.ForceRelease;
    this._selectedReleases = new ArrayItemProvider<ReleaseData>([data]);
    this.dialog.openDialog(
      this._selectedReleases,
      new ArrayItemProvider<ReleaseData>(toCancel)
    );
  }

  private async confirmAction(
    releases: ReleaseData[],
    toCancel: ReleaseData[],
    action: ReleaseApprovalAction,
    comment: string,
    deferredDate: Date | null
  ) {
    switch (action.type) {
      case ActionType.Approve:
        await this._approvalsService.approveAll(
          releases.map((r) => r.approval!),
          comment,
          deferredDate
        );
        break;
      case ActionType.Reject:
        await this._approvalsService.rejectAll(
          releases.map((r) => r.approval!),
          comment
        );
      case ActionType.ForceRelease:
      // cancel all previous releases (for selected env)
      // wait until selected release has pending approval
      // confirm the pending approval
      // await this._approvalsService.cancelAll(
      //   toCancel),
      //   comment
      // );
      // await this._approvalsService.approveAll(
      //   releases.map((r) => r.approval!),
      //   comment,
      //   deferredDate
      // );
    }
  }

  private getSelectedReleases(): void {
    this._selectedReleases = new ArrayItemProvider<ReleaseData>([]);
    let releases: Array<ReleaseData> = new Array<ReleaseData>();
    this._selection.value.forEach((range: ISelectionRange) => {
      for (
        let index: number = range.beginIndex;
        index <= range.endIndex;
        index++
      ) {
        const data = this._treeItemProvider.value[index].underlyingItem.data;
        if (data.approval) {
          releases.push(data.approval);
        }
      }
    });
    this._selectedReleases = new ArrayItemProvider<ReleaseData>(releases);
  }

  private async showErrorMessage(message: string): Promise<void> {
    const globalMessagesSvc = await SDK.getService<IGlobalMessagesService>(
      CommonServiceIds.GlobalMessagesService
    );
    globalMessagesSvc.addToast({
      duration: 3000,
      message: message,
    });
  }
}
function toTreeItem(release: ReleaseData): ITreeItem<ReleaseData> {
  const row: ITreeItem<ReleaseData> = {
    data: release,
  };
  return row;
}

class ItemProvider extends ObservableArray<ReleaseRow> {
  public refresh(n: ReleaseRow) {
    if (n.underlyingItem.expanded) {
      this.toggle(n);
      this.toggle(n);
    }
  }

  public toggle(treeItem: ReleaseRow) {
    var itemIndex = this.value.indexOf(treeItem);
    if (itemIndex >= 0) {
      const item = treeItem.underlyingItem;
      if (item.childItems === undefined) {
        console.log("no children to toggle");
        return;
      }
      const collapse = !!item.expanded;
      item.expanded = !collapse;

      if (collapse) {
        const visibleChildren = this.getChildRows(treeItem);
        this.splice(itemIndex + 1, visibleChildren.length || 0);
      } else {
        this.splice(
          itemIndex + 1,
          0,
          ...(item.childItems?.map((c) => this.toRow(c, 1, treeItem)) || [])
        );
      }
    }
  }

  public add(item: ITreeItem<ReleaseData>) {
    const treeNode = this.toRow(item, 0);
    this.push(treeNode);
    return treeNode;
  }

  private toRow(
    underlyingItem: ITreeItem<ReleaseData>,
    depth: number,
    parentItem?: ReleaseRow
  ): ReleaseRow {
    return {
      underlyingItem,
      depth,
      parentItem,
    };
  }

  private getRows(items: ITreeItem<ReleaseData>[]) {
    return this.value.filter((v) =>
      items.find((i) => i.data === v.underlyingItem.data)
    );
  }

  private getChildRows(parent: ITreeItemEx<ReleaseData>) {
    return this.value.filter((v) => v.parentItem === parent);
  }

  // private indexOf(treeItem: ReleaseRow, fromIndex?: number) {
  //   if (!fromIndex) {
  //     fromIndex = 0;
  //   }
  //   super.value
  //   // @TODO: Can we come up with a faster method than this.
  //   for (var index = fromIndex; index < this.length; index++) {
  //     if (treeItem === this.value[index]) {
  //       return index;
  //     }
  //   }
  //   return -1;
  // }
}
