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

    return {
      load: function(widgetSettings) {
        // validate settings
        let releaseDefinitionId = widgetSettings.releaseDefinitionId;
        let releaseEnvironmentId = widgetSettings.releaseEnvironmentId;
        let measurmentUnit = widgetSettings.measurmentUnit;
        let measurementSla = widgetSettings.measurementSla;
        let measurementSlo = widgetSettings.measurementSlo;
        let title = widgetSettings.title;

        if (
          !releaseDefinitionId ||
          !releaseEnvironmentId ||
          !measurmentUnit ||
          !measurementSla ||
          !measurementSlo ||
          !title
        ) {
          return WidgetHelpers.WidgetStatusHelper.Failure("Invalid Settings");
        }

        let titleElement = $("h2.title");
        titleElement.text(title);

        let labelElement = $("#label");
        labelElement.text(`${measurmentUnit} since last release`);

        release
          .getLatestReleaseForEnvironment(
            releaseDefinitionId,
            releaseEnvironmentId
          )
          .then(release => {
            console.log("got release:", r);
            let lastReleaseTime = moment(r.createdOn);
            let now = moment();

            let difference = now.diff(lastReleaseTime, measurmentUnit);
            let data = $("#data");
            data.text(difference);

            // color the widget according to the health
            let cellColor = "red";
            if (!difference || difference > measurementSla) {
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
    };
  });
  VSS.notifyLoadSucceeded();
});
