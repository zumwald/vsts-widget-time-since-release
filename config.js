/// <reference types="vss-web-extension-sdk" />

// must require VSS sdk to add it to the dependency tree
// and allow script-loader to work its magic
require("vss-web-extension-sdk/lib/VSS.SDK.min.js");
import { Release } from "./lib/release";

// default options
let options = {
  releaseDefinitionId: null,
  releaseEnvironmentId: null,
  measurmentUnit: "days",
  title: "",
  measurementSla: 14,
  measurementSlo: 7,
  sourceBranchFilter: ""
};

const emptyString = "";

VSS.init({
  explicitNotifyLoaded: true,
  usePlatformStyles: true
});

VSS.require("TFS/Dashboards/WidgetHelpers", function(WidgetHelpers) {
  WidgetHelpers.IncludeWidgetConfigurationStyles();

  VSS.register("vsts-widget-time-since-release-configuration", function() {
    // print out extension context
    console.info("Extension Context:", VSS.getExtensionContext());
    let context = VSS.getWebContext();
    console.info("Web Context:", context);

    function getCustomSettings() {
      let customSettings = { data: JSON.stringify(options) };
      console.log("customSettings:", customSettings);

      return customSettings;
    }

    return {
      load: function(widgetSettings, widgetConfigurationContext) {
        function broadcastSettings() {
          widgetConfigurationContext.notify(
            WidgetHelpers.WidgetEvent.ConfigurationChange,
            WidgetHelpers.WidgetEvent.Args(getCustomSettings())
          );
        }

        // initialize pre-existing settings
        let priorSettings = JSON.parse(widgetSettings.customSettings.data);
        if (priorSettings) {
          Object.getOwnPropertyNames(priorSettings).forEach(k => {
            if (priorSettings[k]) {
              options[k] = priorSettings[k];
            }
          });
        }
        console.log("existing settings were:", options);
        broadcastSettings();

        function registerChangeHandler(
          elementToWatch,
          optionKeyToSet,
          valueGetter
        ) {
          elementToWatch.change(function() {
            // save the value to the options object
            let value = valueGetter ? valueGetter() : $(this).val();
            options[optionKeyToSet] = value;

            console.log("set", optionKeyToSet, "to", value);

            // save the current WidgetConfigurationContext and broadcast the change
            broadcastSettings();
          });
        }

        function initializeElement(element, setting) {
          if (setting !== null && setting !== undefined) {
            element.val(setting);
          }
        }

        let release = new Release(context);

        // register to changes to the measurement units radio selector
        registerChangeHandler(
          $("#measurement-options-fieldset"),
          "measurmentUnit",
          () => $("input[name=measurement-options]:checked").val()
        );

        // register changes to the title input
        let titleElement = $("#title");
        registerChangeHandler(titleElement, "title");
        initializeElement(titleElement, options.title);

        // register changes to the measurementSla input
        let measurementSlaElement = $("#measurementSla");
        registerChangeHandler(measurementSlaElement, "measurementSla");
        initializeElement(measurementSlaElement, options.measurementSla);

        // register changes to the measurementSlo input
        let measurementSloElement = $("#measurementSlo");
        registerChangeHandler(measurementSloElement, "measurementSlo");
        initializeElement(measurementSloElement, options.measurementSlo);

        // register changes to the sourceBranchFilter string
        let sourceBranchFilterElement = $("#sourceBranchFilter");
        registerChangeHandler(sourceBranchFilterElement, "sourceBranchFilter");
        initializeElement(
          sourceBranchFilterElement,
          options.sourceBranchFilter
        );

        // we need to hydrate the release-definition-dropdown with the releases in our project
        release.getReleaseDefinitions().then(releaseDefinitions => {
          console.log("got release definitions:", releaseDefinitions);
          let releaseDefinitionSelector = $("#release-definition-dropdown");

          function getOptionHtmlForReleaseDefinition(releaseDefinition) {
            return `<option value="${releaseDefinition.id}">${
              releaseDefinition.name
            }</option>`;
          }

          let markupToInsert = releaseDefinitions
            .map(r => getOptionHtmlForReleaseDefinition(r))
            .join(emptyString);

          releaseDefinitionSelector.append(markupToInsert);

          // once the user selects a release, we can fetch the environments to show in release-environment-dropdown
          releaseDefinitionSelector.change(function() {
            broadcastSettings();

            options.releaseDefinitionId = $(this).val();
            release
              .getEnvironmentsForRelease(options.releaseDefinitionId)
              .then(environments => {
                console.log("got release environments:", environments);
                let releaseEnvironmentSelector = $(
                  "#release-environment-dropdown"
                );

                function getOptionHtmlForEnvironment(environment) {
                  return `<option value="${environment.id}">${
                    environment.name
                  }</option>`;
                }

                let markupToInsert = environments
                  .map(e => getOptionHtmlForEnvironment(e))
                  .join(emptyString);

                releaseEnvironmentSelector.append(markupToInsert);

                registerChangeHandler(
                  releaseEnvironmentSelector,
                  "releaseEnvironmentId"
                );
              });
          });
        });

        return WidgetHelpers.WidgetStatusHelper.Success();
      },
      onSave: function() {
        return WidgetHelpers.WidgetConfigurationSave.Valid(getCustomSettings());
      }
    };
  });
  VSS.notifyLoadSucceeded();
});
