'use strict';

// Credit: http://jsfiddle.net/guxxL9Lw/
angular.module('core').directive('countdown', [
    'Util',
    '$interval',
    '$interpolate',
    function (Util, $interval, $interpolate) {
        return {
            restrict: 'A',
            scope: { date: '=' },
            link: function (scope, element, attrs) {
                var future;
                // wait for date variable to be initialized
                var watcher = scope.$watch('date', function() {
                    if (scope.date === undefined) return;
                    future = new Date(scope.date);
                });

                $interval(function () {
                    var diff;
                    diff = Math.floor((future.getTime() - new Date().getTime()) / 1000);
                    return element.text(Util.dhms(diff));
                }, 1000);
            }
        };
    }
]).factory('Util', [function () {
    return {
        dhms: function (t) {
            var days, hours, minutes, seconds;
            days = Math.floor(t / 86400);
            t -= days * 86400;
            hours = Math.floor(t / 3600) % 24;
            t -= hours * 3600;
            minutes = Math.floor(t / 60) % 60;
            t -= minutes * 60;
            seconds = t % 60;
            return [
                days + 'd',
                hours + 'h',
                minutes + 'm',
                seconds + 's'
            ].join(' ');
        }
    };
}]);