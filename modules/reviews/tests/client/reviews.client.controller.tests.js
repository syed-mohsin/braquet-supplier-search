'use strict';

(function () {
  // Reviews Controller Spec
  describe('Reviews Controller Tests', function () {
    // Initialize global variables
    var ReviewsController,
      scope,
      $httpBackend,
      $stateParams,
      $location,
      Authentication,
      Reviews,
      mockReview;

    // The $resource service augments the response object with methods for updating and deleting the resource.
    // If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
    // the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
    // When the toEqualData matcher compares two objects, it takes only object properties into
    // account and ignores methods.
    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    // Then we can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_, _Authentication_, _Reviews_) {
      // Set a new global scope
      scope = $rootScope.$new();

      // Point global variables to injected services
      $stateParams = _$stateParams_;
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      Authentication = _Authentication_;
      Reviews = _Reviews_;

      // create mock review
      mockReview = new Reviews({
        _id: '525a8422f6d0f87f0e407a33',
        title: 'An Review about MEAN',
        content: 'MEAN rocks!'
      });

      // Mock logged in user
      Authentication.user = {
        roles: ['user']
      };

      // Initialize the Reviews controller.
      ReviewsController = $controller('ReviewsController', {
        $scope: scope
      });
    }));

    it('$scope.find() should create an array with at least one review object fetched from XHR', inject(function (Reviews) {
      // Create a sample reviews array that includes the new review
      var sampleReviews = [mockReview];

      // Set GET response
      $httpBackend.expectGET('api/reviews').respond(sampleReviews);

      // Run controller functionality
      scope.find();
      $httpBackend.flush();

      // Test scope value
      expect(scope.reviews).toEqualData(sampleReviews);
    }));

    it('$scope.findOne() should create an array with one review object fetched from XHR using a reviewId URL parameter', inject(function (Reviews) {
      // Set the URL parameter
      $stateParams.reviewId = mockReview._id;

      // Set GET response
      $httpBackend.expectGET(/api\/reviews\/([0-9a-fA-F]{24})$/).respond(mockReview);

      // Run controller functionality
      scope.findOne();
      $httpBackend.flush();

      // Test scope value
      expect(scope.review).toEqualData(mockReview);
    }));

    describe('$scope.create()', function () {
      var sampleReviewPostData;

      beforeEach(function () {
        // Create a sample review object
        sampleReviewPostData = new Reviews({
          title: 'An Review about MEAN',
          content: 'MEAN rocks!'
        });

        // Fixture mock form input values
        scope.title = 'An Review about MEAN';
        scope.content = 'MEAN rocks!';

        spyOn($location, 'path');
      });

      it('should send a POST request with the form input values and then locate to new object URL', inject(function (Reviews) {
        // Set POST response
        $httpBackend.expectPOST('api/reviews', sampleReviewPostData).respond(mockReview);

        // Run controller functionality
        scope.create(true);
        $httpBackend.flush();

        // Test form inputs are reset
        expect(scope.title).toEqual('');
        expect(scope.content).toEqual('');

        // Test URL redirection after the review was created
        expect($location.path.calls.mostRecent().args[0]).toBe('reviews/' + mockReview._id);
      }));

      it('should set scope.error if save error', function () {
        var errorMessage = 'this is an error message';
        $httpBackend.expectPOST('api/reviews', sampleReviewPostData).respond(400, {
          message: errorMessage
        });

        scope.create(true);
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      });
    });

    describe('$scope.update()', function () {
      beforeEach(function () {
        // Mock review in scope
        scope.review = mockReview;
      });

      it('should update a valid review', inject(function (Reviews) {
        // Set PUT response
        $httpBackend.expectPUT(/api\/reviews\/([0-9a-fA-F]{24})$/).respond();

        // Run controller functionality
        scope.update(true);
        $httpBackend.flush();

        // Test URL location to new object
        expect($location.path()).toBe('/reviews/' + mockReview._id);
      }));

      it('should set scope.error to error response message', inject(function (Reviews) {
        var errorMessage = 'error';
        $httpBackend.expectPUT(/api\/reviews\/([0-9a-fA-F]{24})$/).respond(400, {
          message: errorMessage
        });

        scope.update(true);
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      }));
    });

    describe('$scope.remove(review)', function () {
      beforeEach(function () {
        // Create new reviews array and include the review
        scope.reviews = [mockReview, {}];

        // Set expected DELETE response
        $httpBackend.expectDELETE(/api\/reviews\/([0-9a-fA-F]{24})$/).respond(204);

        // Run controller functionality
        scope.remove(mockReview);
      });

      it('should send a DELETE request with a valid reviewId and remove the review from the scope', inject(function (Reviews) {
        expect(scope.reviews.length).toBe(1);
      }));
    });

    describe('scope.remove()', function () {
      beforeEach(function () {
        spyOn($location, 'path');
        scope.review = mockReview;

        $httpBackend.expectDELETE(/api\/reviews\/([0-9a-fA-F]{24})$/).respond(204);

        scope.remove();
        $httpBackend.flush();
      });

      it('should redirect to reviews', function () {
        expect($location.path).toHaveBeenCalledWith('reviews');
      });
    });
  });
}());
