// must require VSS sdk to add it to the dependency tree
// and allow script-loader to work its magic
require("vss-web-extension-sdk/lib/VSS.SDK.min.js");

VSS.init({
  explicitNotifyLoaded: true,
  usePlatformStyles: true
});

console.log("foo");

VSS.require("TFS/Dashboards/WidgetHelpers", function(WidgetHelpers) {
  WidgetHelpers.IncludeWidgetStyles();
  VSS.register("vsts-widget-time-since-release", function() {
    return {
      load: function(widgetSettings) {
        var $title = $("h2.title");
        $title.text("Hello World");

        console.log("bar");

        return WidgetHelpers.WidgetStatusHelper.Success();
      }
    };
  });
  VSS.notifyLoadSucceeded();
});
