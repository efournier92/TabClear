'use strict';(function(){angular.module('nerveCenter').directive('scrolly',scrolly);function scrolly($window){return{restrict:'AEC',link:function link(scope,element,attrs){var raw=element[0];element.bind('scroll',function(){if(raw.scrollTop+raw.offsetHeight>raw.scrollHeight){scope.$apply(attrs.scrolly)}})}}};});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9kaXJlY3RpdmVzL3Njcm9sbERvd24uZGlyZWN0aXZlLmpzIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJkaXJlY3RpdmUiLCJzY3JvbGx5IiwiJHdpbmRvdyIsInJlc3RyaWN0IiwibGluayIsInNjb3BlIiwiZWxlbWVudCIsImF0dHJzIiwicmF3IiwiYmluZCIsInNjcm9sbFRvcCIsIm9mZnNldEhlaWdodCIsInNjcm9sbEhlaWdodCIsIiRhcHBseSJdLCJtYXBwaW5ncyI6ImFBQUEsQ0FBQyxVQUFZLENBRVhBLFFBQ0NDLE1BRERELENBQ1EsYUFEUkEsRUFFQ0UsU0FGREYsQ0FFVyxTQUZYQSxDQUVzQkcsT0FGdEJILEVBSUEsUUFBU0csUUFBVCxDQUFpQkMsT0FBakIsQ0FBMEIsQ0FDeEIsTUFBTyxDQUNMQyxTQUFVLEtBREwsQ0FFTEMsS0FBTSxjQUFVQyxLQUFWLENBQWlCQyxPQUFqQixDQUEwQkMsS0FBMUIsQ0FBaUMsQ0FDckMsR0FBSUMsS0FBTUYsUUFBUSxDQUFSQSxDQUFWLENBRUFBLFFBQVFHLElBQVJILENBQWEsUUFBYkEsQ0FBdUIsVUFBWSxDQUNqQyxHQUFJRSxJQUFJRSxTQUFKRixDQUFnQkEsSUFBSUcsWUFBcEJILENBQW1DQSxJQUFJSSxZQUEzQyxDQUF5RCxDQUN2RFAsTUFBTVEsTUFBTlIsQ0FBYUUsTUFBTU4sT0FBbkJJLENBQ0QsQ0FISCxDQUFBQyxDQUtELENBVkksQ0FZUixFQW5CSCxDQUFBIiwiZmlsZSI6ImNvbW1vbi9kaXJlY3RpdmVzL3Njcm9sbERvd24uZGlyZWN0aXZlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uICgpIHtcblxuICBhbmd1bGFyXG4gIC5tb2R1bGUoJ25lcnZlQ2VudGVyJylcbiAgLmRpcmVjdGl2ZSgnc2Nyb2xseScsIHNjcm9sbHkpO1xuXG4gIGZ1bmN0aW9uIHNjcm9sbHkoJHdpbmRvdykge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0FFQycsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIHZhciByYXcgPSBlbGVtZW50WzBdO1xuXG4gICAgICAgIGVsZW1lbnQuYmluZCgnc2Nyb2xsJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmIChyYXcuc2Nyb2xsVG9wICsgcmF3Lm9mZnNldEhlaWdodCA+IHJhdy5zY3JvbGxIZWlnaHQpIHtcbiAgICAgICAgICAgIHNjb3BlLiRhcHBseShhdHRycy5zY3JvbGx5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH07XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==