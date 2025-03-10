import type { Faker } from "../faker";
import _ from "lodash";

export type Item = {
  section: string;
  id: string;
  value: string;
  getValue(): string;
};

export type Pin = (item: Item) => void;

interface FakerListItemProps {
  item: Item;
  pin?: Pin;
  unpin?: Pin;
  faker: Faker;
}

const blacklistPaths = [
  "locales",
  "locale",
  "_locale",
  "localeFallback",
  "_localeFallback",
  "definitions",
  "fake",
  "faker",
  "unique",
  "helpers",
  "mersenne",
  "random",
  "science",
];

export const buildItems = (path: string, faker: Faker) => {
  return _.reduce(
    path ? _.get(faker, path) : faker,
    (acc: Item[], func, key) => {
      if (blacklistPaths.includes(key)) {
        return acc;
      }

      if (_.isFunction(func)) {
        const getValue = (): string => {
          const value = func();
          if (_.isBoolean(value)) return value.toString();
          if (!value) return "";
          return value.toString();
        };
        acc.push({ section: path, id: key, value: getValue(), getValue });
      } else if (_.isObject(func)) {
        acc.push(...buildItems(path ? `${path}.${key}` : key, faker));
      }

      return acc;
    },
    []
  );
};
