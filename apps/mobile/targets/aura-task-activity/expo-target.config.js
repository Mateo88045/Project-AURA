/**
 * Config for the Aura Live Activity widget extension, consumed by the
 * `@bacons/apple-targets` Expo config plugin. Running `expo prebuild`
 * generates a real iOS widget-extension target from the Swift files in this
 * folder. See modules/aura-live-activity/README.md for the full build steps.
 *
 * @type {import('@bacons/apple-targets').Config}
 */
module.exports = {
  type: 'widget',
  name: 'AuraTaskActivity',
  deploymentTarget: '16.2',
  frameworks: ['SwiftUI', 'WidgetKit', 'ActivityKit'],
};
