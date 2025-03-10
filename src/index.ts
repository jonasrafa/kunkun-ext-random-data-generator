import {
  Action,
  clipboard,
  expose,
  Icon,
  IconEnum,
  List,
  open,
  Markdown,
  TemplateUiCommand,
  toast,
  ui,
} from "@kksh/api/ui/template";
import { buildItems, type Item } from "./utils";
import faker from "./faker";
import _ from "lodash";
import isUrl from "is-url";

const Actions = {
  OpenInBrowser: "Open in Browser",
  CopyToClipboard: "Copy to Clipboard",
  RefreshValue: "Refresh Value (Not implemented)",
  PinEntry: "Pin Entry (Not implemented)",
  UnpinEntry: "Unpin Entry (Not implemented)",
};

class RandomDataGenerator extends TemplateUiCommand {
  private items: Item[] = [];

  private groupItemsBySection(items: Item[]): { [key: string]: Item[] } {
    const sectionsMap: { [key: string]: Item[] } = {};
    items.forEach((item) => {
      if (!sectionsMap[item.section]) {
        sectionsMap[item.section] = [];
      }
      sectionsMap[item.section].push(item);
    });
    return sectionsMap;
  }

  private createSections(sectionsMap: {
    [key: string]: Item[];
  }): List.Section[] {
    return Object.entries(sectionsMap).map(
      ([sectionName, sectionItems]) =>
        new List.Section({
          title: _.startCase(sectionName),
          items: sectionItems.map(
            (item: { section: string; id: string; value: string }) => {
              const actions = [
                new Action.Action({
                  title: Actions.CopyToClipboard,
                  value: Actions.CopyToClipboard,
                  icon: new Icon({
                    type: IconEnum.Iconify,
                    value: "material-symbols:copy-all",
                  }),
                }),
                new Action.Action({
                  title: Actions.RefreshValue,
                  value: Actions.RefreshValue,
                  icon: new Icon({
                    type: IconEnum.Iconify,
                    value: "material-symbols:refresh",
                  }),
                }),
                new Action.Action({
                  title: Actions.PinEntry,
                  value: Actions.PinEntry,
                  icon: new Icon({
                    type: IconEnum.Iconify,
                    value: "material-symbols:pin",
                  }),
                }),
                new Action.Action({
                  title: Actions.UnpinEntry,
                  value: Actions.UnpinEntry,
                  icon: new Icon({
                    type: IconEnum.Iconify,
                    value: "material-symbols:unpin",
                  }),
                }),
              ];

              if (isUrl(item.value)) {
                actions.unshift(
                  new Action.Action({
                    title: Actions.OpenInBrowser,
                    value: Actions.OpenInBrowser,
                    icon: new Icon({
                      type: IconEnum.Iconify,
                      value: "material-symbols:open-in-new",
                    }),
                  })
                );
              }

              return new List.Item({
                title: _.startCase(item.id),
                value: item.value,
                keywords: [item.section],
                // subTitle: _.truncate(item.value, {
                //   length: 20,
                //   omission: "...",
                // }),
                icon: new Icon({
                  type: IconEnum.Iconify,
                  value: "material-symbols:circle-outline",
                }),
                defaultAction: Actions.CopyToClipboard,
                actions: new Action.ActionPanel({
                  items: actions,
                }),
              });
            }
          ),
        })
    );
  }

  async load() {
    faker.setLocale("en");
    this.items = buildItems("", faker);

    const sectionsMap = this.groupItemsBySection(this.items);
    const sections = this.createSections(sectionsMap);

    return ui.setSearchBarPlaceholder("Search...").then(() => {
      return ui.render(
        new List.List({
          sections: sections,
        })
      );
    });
  }

  onListItemSelected(value: string): Promise<void> {
    return clipboard
      .writeText(value)
      .then(() => {
        return toast.success("Copied to clipboard");
      })
      .catch((err) => {
        console.error(err);
        return toast.error("Failed to copy to clipboard");
      });
  }

  async onActionSelected(actionValue: string): Promise<void> {
    if (this.highlightedListItemValue) {
      switch (actionValue) {
        case Actions.OpenInBrowser:
          return open.url(this.highlightedListItemValue);

        case Actions.CopyToClipboard:
          return this.onListItemSelected(this.highlightedListItemValue);
        default:
          break;
      }
    }
  }

  onHighlightedListItemChanged(value: string): Promise<void> {
    this.highlightedListItemValue = value;
    return ui.render(
      new List.List({
        inherits: ["items", "sections"],
        detail: new List.ItemDetail({
          children: [new Markdown(this.highlightedListItemValue || "")],
          width: 50,
        }),
      })
    );
  }
}

expose(new RandomDataGenerator());
