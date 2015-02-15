'use strict';

var Application = Application || {};

Application.Constants = angular.module('application.constants', []);
Application.Services = angular.module('application.services', []);
Application.Controllers = angular.module('application.controllers', []);
Application.Filters = angular.module('application.filters', []);
Application.Directives = angular.module('application.directives', []);

angular.module('application', ['ngSanitize', 'application.filters', 'application.services', 'application.directives', 'application.constants', 'application.controllers','LocalStorageModule']);