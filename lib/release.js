/// <reference types="vss-web-extension-sdk" />

import "whatwg-fetch";

export class Release {
  constructor(context) {
    console.log("context:", context);

    function getBaseReleasesApi() {
      return `https://${context.collection.name}.vsrm.visualstudio.com/${
        context.project.name
      }/_apis/Release`;
    }

    function getReleasesApi() {
      return getBaseReleasesApi() + "/releases";
    }

    function getReleaseDefinitionsApi() {
      return getBaseReleasesApi() + "/definitions";
    }

    function getAuthHeader() {
      return new Promise((resolve, reject) => {
        VSS.require(["VSS/Authentication/Services"], function(
          VSS_Auth_Service
        ) {
          VSS.getAccessToken().then(token => {
            // Format the auth header
            let authHeader = VSS_Auth_Service.authTokenManager.getAuthorizationHeader(
              token
            );
            resolve(authHeader);
          });
        });
      });
    }

    function authenticatedGet(url) {
      console.log("GET:", url);
      return getAuthHeader()
        .then(authHeader =>
          fetch(url, {
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader
            }
          })
        )
        .then(x => x.json());
    }

    this.getReleaseDefinitions = () => {
      const api = getReleaseDefinitionsApi();

      return authenticatedGet(api).then(result => {
        if (!result || !result.value) {
          return Promise.reject("Malformed response to getReleaseDefinitions");
        } else {
          return Promise.resolve(result.value);
        }
      });
    };

    this.getEnvironmentsForRelease = releaseId => {
      const api = getReleaseDefinitionsApi() + `/${releaseId}`;

      return authenticatedGet(api).then(result => {
        if (!result || !result.environments) {
          return Promise.reject("Malformed response to getReleaseDefinitions");
        } else {
          return Promise.resolve(result.environments);
        }
      });
    };

    this.getLatestReleaseForEnvironment = (
      definitionId,
      environmentId,
      sourceBranchFilter
    ) => {
      // magic "environmentStatusFilter" was buried deep in VSTS docs:
      // https://www.visualstudio.com/en-us/docs/integrate/api/rm/contracts#EnvironmentStatus
      // we use it to only consider succeeded environments
      let api =
        getReleasesApi() +
        `?definitionId=${definitionId}&definitionEnvironmentId=${environmentId}&$top=1&environmentStatusFilter=4`;

      // VSTS expects the "full" ref name, meaning it starts with refs/heads/ followed
      // by the branch name as most folks know it. We'll handle that detail here,
      // it's not worth imposing it on the user.
      if (sourceBranchFilter && sourceBranchFilter !== "") {
        api = api + `&sourceBranchFilter=refs/heads/${sourceBranchFilter}`;
      }

      return authenticatedGet(api).then(result => {
        console.log("result:", result);
        if (!result || !result.count === 1) {
          return Promise.reject("malformed response:", result);
        } else {
          return Promise.resolve(result.value[0]);
        }
      });
    };
  }
}
