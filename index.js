/// <reference types="vss-web-extension-sdk" />

// must require VSS sdk to add it to the dependency tree
// and allow script-loader to work its magic
require("vss-web-extension-sdk/lib/VSS.SDK.min.js");
import { Release } from "./lib/release";
let moment = require("moment");

VSS.init({
  explicitNotifyLoaded: true,
  usePlatformStyles: true
});

VSS.require("TFS/Dashboards/WidgetHelpers", function(WidgetHelpers) {
  WidgetHelpers.IncludeWidgetStyles();
  VSS.register("vsts-widget-time-since-release", function() {
    // print out extension context
    console.info("Extension Context:", VSS.getExtensionContext());
    let context = VSS.getWebContext();
    console.info("Web Context:", context);

    let release = new Release(context);

    function loadWidget(widgetSettings) {
      console.log("settings:", widgetSettings);
      let settings = JSON.parse(widgetSettings.customSettings.data);
      // validate settings
      let releaseDefinitionId = (settings && settings.releaseDefinitionId) || 1;
      let releaseEnvironmentId =
        (settings && settings.releaseEnvironmentId) || 1;
      let measurmentUnit = (settings && settings.measurmentUnit) || "days";
      let measurementSla = (settings && settings.measurementSla) || 14;
      let measurementSlo = (settings && settings.measurementSlo) || 7;
      let title = (settings && settings.title) || "";
      let sourceBranchFilter = (settings && settings.sourceBranchFilter) || "";

      if (
        !releaseDefinitionId ||
        !releaseEnvironmentId ||
        !measurmentUnit ||
        !measurementSla ||
        !measurementSlo ||
        !title
      ) {
        return WidgetHelpers.WidgetStatusHelper.Unconfigured();
      }

      let titleElement = $("h2.title");
      titleElement.text(title);

      let labelElement = $("#label");
      labelElement.text(`${measurmentUnit} since last release`);

      release
        .getLatestDeploymentForEnvironment(
          releaseDefinitionId,
          releaseEnvironmentId,
          sourceBranchFilter
        )
        .then(r => {
          console.log("got release:", r);

          const tryGetTimeSinceRelease = r => {
            let result = null;

            try {
              let lastReleaseTime = moment(r ? r.completedOn : 0);
              let now = moment();

              result = now.diff(lastReleaseTime, measurmentUnit);
            } catch (e) {
              console.warn("Caught:", e);
            }

            return result;
          };

          let difference = tryGetTimeSinceRelease(r);
          let data = $("#data");
          data.text(difference);

          // color the widget according to the health
          let cellColor = "red";
          if (difference === null) {
            cellColor = "grey";
          } else if (difference > measurementSla) {
            // we're in trouble, not meeting SLA
            cellColor = "red";
          } else if (difference > measurementSlo) {
            // we're not in emergency mode, but meeting SLO
            cellColor = "yellow";
          } else {
            // we're meeting SLO
            cellColor = "green";
          }
          $("body").css("background-color", cellColor);
        });

      return WidgetHelpers.WidgetStatusHelper.Success();
    }

    return {
      load: loadWidget,
      reload: loadWidget
    };
  });
  VSS.notifyLoadSucceeded();
});
