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
  measurementSlo: 7
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

    let release = new Release(context);

    // register to changes to the measurement units radio selector
    let measurementUnitFieldSet = $("#measurement-options-fieldset");
    measurementUnitFieldSet.change(function() {
      let measurementElement = $("input[name=measurement-options]:checked");
      options.measurmentUnit = measurementElement.val();
      console.log("measurementUnit:", options.measurmentUnit);
    });

    // register to changes to the title input
    let titleElement = $("#title");
    titleElement.change(function() {
      options.title = $(this).val();
      console.log("title:", options.title);
    });

    // register to changes to the measurementSla input
    let slaElement = $("#measurementSla");
    slaElement.change(function() {
      options.measurementSla = $(this).val();
      console.log("SLA:", options.measurementSla);
    });

    // register to changes to the measurementSlo input
    let sloElement = $("#measurementSlo");
    sloElement.change(function() {
      options.measurementSlo = $(this).val();
      console.log("SLO:", options.measurementSlo);
    });

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
        options.releaseDefinitionId = $(this).val();
        release
          .getEnvironmentsForRelease(options.releaseDefinitionId)
          .then(environments => {
            console.log("got release environments:", environments);
            let releaseEnvironmentSelector = $("#release-environment-dropdown");

            function getOptionHtmlForEnvironment(environment) {
              return `<option value="${environment.id}">${
                environment.name
              }</option>`;
            }

            let markupToInsert = environments
              .map(e => getOptionHtmlForEnvironment(e))
              .join(emptyString);

            releaseEnvironmentSelector.append(markupToInsert);
            releaseEnvironmentSelector.change(function() {
              options.releaseEnvironmentId = $(this).val();
            });
          });
      });
    });

    return {
      load: function(widgetSettings, widgetConfigurationContext) {
        let settings = JSON.parse(widgetSettings.customSettings.data);

        return WidgetHelpers.WidgetStatusHelper.Success();
      },
      onSave: function() {
        let customSettings = {
          data: JSON.stringify(options)
        };
        return WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);
      }
    };
  });
  VSS.notifyLoadSucceeded();
});
