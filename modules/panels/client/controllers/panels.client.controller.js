'use strict';

angular.module('panels').controller('PanelController', ['$scope', '$stateParams', '$filter', '$timeout', '$window', 'FileUploader', 'PanelModels',
  function ($scope, $stateParams, $filter, $timeout, $window, FileUploader, PanelModels) {
    PanelModels.query(function (data) {
      $scope.panel_models = data;
      $scope.buildPager();
    });

    $scope.findOne = function() {
      PanelModels.get({
        panelId: $stateParams.panelId
      }, function(panel) {
        $scope.panel = panel;
        $scope.buildUploader(panel._id);
      });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.panel_models, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };

    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: 'api/panels/photo/',
      alias: 'newPanelModelPhoto'
    });

    $scope.buildUploader = function(panelId) {
      // change uploader url
      $scope.uploader.url = 'api/panels/photo/' + panelId;

          // Set file uploader image filter
      $scope.uploader.filters.push({
        name: 'imageFilter',
        fn: function (item, options) {
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
          return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
      });

      // Called after the user selected a new picture file
      $scope.uploader.onAfterAddingFile = function (fileItem) {
        if ($window.FileReader) {
          var fileReader = new FileReader();
          fileReader.readAsDataURL(fileItem._file);

          fileReader.onload = function (fileReaderEvent) {
            $timeout(function () {
              $scope.panel.panelPhotoUrl = fileReaderEvent.target.result;
            }, 0);
          };
        }
      };

      $scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
        // Show success message
        $scope.success = true;

        // Clear upload buttons
        $scope.cancelUpload();
      };

      // Called after the user has failed to uploaded a new picture
      $scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
        // Clear upload buttons
        $scope.cancelUpload();

        // Show error message
        $scope.error = response.message;
      };

      // Change user profile picture
      $scope.uploadProfilePicture = function (panelId) {
        // Clear messages
        $scope.success = $scope.error = null;
        console.log('inside panelPhoto upload');

        // Start upload
        $scope.uploader.uploadAll();
      };

      // Cancel the upload process
      $scope.cancelUpload = function () {
        $scope.uploader.clearQueue();
        $scope.imageURL = $scope.panel.panelPhotoUrl;
      };
    };
  }
]);
