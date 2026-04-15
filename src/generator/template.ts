import Handlebars from "handlebars";

Handlebars.registerHelper("capitalize", (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
});

Handlebars.registerHelper("lowercase", (str: string) => {
  if (!str) return "";
  return str.toLowerCase();
});

Handlebars.registerHelper("uppercase", (str: string) => {
  if (!str) return "";
  return str.toUpperCase();
});

Handlebars.registerHelper("camelCase", (str: string) => {
  if (!str) return "";
  return str
    .replace(/[-_\s]+(.)?/g, (_, c: string) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (_, c: string) => c.toLowerCase());
});

Handlebars.registerHelper("pascalCase", (str: string) => {
  if (!str) return "";
  return str
    .replace(/[-_\s]+(.)?/g, (_, c: string) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
});

export function renderTemplate(
  templateContent: string,
  variables: Record<string, string>
): string {
  const compiled = Handlebars.compile(templateContent, { noEscape: true });
  return compiled(variables);
}
