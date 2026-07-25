import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';

const traverse = traverseModule.default;
const generate = generateModule.default;
const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(frontendRoot, 'src');
const unitless = new Set([
  'animationIterationCount', 'borderImageOutset', 'borderImageSlice',
  'borderImageWidth', 'boxFlex', 'boxFlexGroup', 'boxOrdinalGroup',
  'columnCount', 'columns', 'flex', 'flexGrow', 'flexPositive',
  'flexShrink', 'flexNegative', 'flexOrder', 'gridArea', 'gridRow',
  'gridRowEnd', 'gridRowSpan', 'gridRowStart', 'gridColumn',
  'gridColumnEnd', 'gridColumnSpan', 'gridColumnStart', 'fontWeight',
  'lineClamp', 'lineHeight', 'opacity', 'order', 'orphans',
  'tabSize', 'widows', 'zIndex', 'zoom'
]);

const toKebab = (property) => property
  .replace(/^ms-/, '-ms-')
  .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const toTailwindValue = (property, node) => {
  if (t.isStringLiteral(node)) {
    return node.value
      .replaceAll('\\', '\\\\')
      .replaceAll(' ', '_');
  }
  if (t.isNumericLiteral(node)) {
    if (node.value === 0 || unitless.has(property)) return String(node.value);
    return `${node.value}px`;
  }
  return null;
};

const files = [];
const collect = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(fullPath);
    if (entry.isFile() && /\.(jsx|js)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      files.push(fullPath);
    }
  }
};
collect(sourceRoot);

let migrated = 0;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  let changed = false;

  traverse(ast, {
    JSXOpeningElement(elementPath) {
      const attributes = elementPath.node.attributes;
      const styleIndex = attributes.findIndex((attribute) => (
        t.isJSXAttribute(attribute)
        && t.isJSXIdentifier(attribute.name, { name: 'style' })
        && t.isJSXExpressionContainer(attribute.value)
        && t.isObjectExpression(attribute.value.expression)
      ));
      if (styleIndex < 0) return;

      const styleAttribute = attributes[styleIndex];
      const object = styleAttribute.value.expression;
      const retained = [];
      const classes = [];

      for (const property of object.properties) {
        if (!t.isObjectProperty(property) || property.computed) {
          retained.push(property);
          continue;
        }
        const propertyName = t.isIdentifier(property.key) ? property.key.name : property.key.value;
        const value = toTailwindValue(propertyName, property.value);
        if (value === null) {
          retained.push(property);
          continue;
        }
        classes.push(`[${toKebab(propertyName)}:${value}]`);
      }

      if (!classes.length) return;
      const classIndex = attributes.findIndex((attribute) => (
        t.isJSXAttribute(attribute) && t.isJSXIdentifier(attribute.name, { name: 'className' })
      ));
      const generatedClasses = classes.join(' ');
      if (classIndex < 0) {
        attributes.push(t.jsxAttribute(t.jsxIdentifier('className'), t.stringLiteral(generatedClasses)));
      } else {
        const classAttribute = attributes[classIndex];
        if (t.isStringLiteral(classAttribute.value)) {
          classAttribute.value.value = `${classAttribute.value.value} ${generatedClasses}`.trim();
        } else {
          retained.push(...object.properties.filter((property) => !retained.includes(property)));
          return;
        }
      }

      if (retained.length) {
        object.properties = retained;
      } else {
        attributes.splice(styleIndex, 1);
      }
      migrated += classes.length;
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, `${generate(ast, { retainLines: false }, source).code}\n`);
  }
}

console.log(`Migrated ${migrated} static style declarations across ${files.length} files.`);
