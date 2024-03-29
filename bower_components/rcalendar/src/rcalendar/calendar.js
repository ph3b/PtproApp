angular.module('ui.rCalendar', [])
    .constant('calendarConfig', {
        formatDay: 'dd',
        formatDayHeader: 'EEE',
        formatDayTitle: 'MMMM dd, yyyy',
        formatWeekTitle: 'MMMM yyyy, Week w',
        formatMonthTitle: 'MMMM yyyy',
        calendarMode: 'month',
        showWeeks: false,
        showEventDetail: true,
        startingDay: 0,
        eventSource: null,
        queryMode: 'local'
    })
    .controller('CalendarController', ['$scope', '$attrs', '$parse', '$interpolate', '$log', 'dateFilter', 'calendarConfig', function ($scope, $attrs, $parse, $interpolate, $log, dateFilter, calendarConfig) {
        var self = this,
            ngModelCtrl = { $setViewValue: angular.noop }; // nullModelCtrl;

        // Configuration attributes
        angular.forEach(['formatDay', 'formatDayHeader', 'formatDayTitle', 'formatWeekTitle', 'formatMonthTitle',
            'showWeeks', 'showEventDetail', 'startingDay', 'eventSource', 'queryMode'], function (key, index) {
            self[key] = angular.isDefined($attrs[key]) ? (index < 5 ? $interpolate($attrs[key])($scope.$parent) : $scope.$parent.$eval($attrs[key])) : calendarConfig[key];
        });

        $scope.$parent.$watch('eventSource', function (value) {
            self.onEventSourceChanged(value);
        });

        $scope.calendarMode = $scope.calendarMode || calendarConfig.calendarMode;
        if (angular.isDefined($attrs.initDate)) {
            self.currentCalendarDate = $scope.$parent.$eval($attrs.initDate);
        }
        if (!self.currentCalendarDate) {
            self.currentCalendarDate = new Date();
            if ($attrs.ngModel && !$scope.$parent.$eval($attrs.ngModel)) {
                $parse($attrs.ngModel).assign($scope.$parent, self.currentCalendarDate);
            }
        }

        self.init = function (ngModelCtrl_) {
            ngModelCtrl = ngModelCtrl_;

            ngModelCtrl.$render = function () {
                self.render();
            };
        };

        self.render = function () {
            if (ngModelCtrl.$modelValue) {
                var date = new Date(ngModelCtrl.$modelValue),
                    isValid = !isNaN(date);

                if (isValid) {
                    this.currentCalendarDate = date;
                } else {
                    $log.error('"ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
                }
                ngModelCtrl.$setValidity('date', isValid);
            }
            this.refreshView();
        };

        self.refreshView = function () {
            if (this.mode) {
                this.range = this._getRange(this.currentCalendarDate);
                this._refreshView();
                this.rangeChanged();
            }
        };

        // Split array into smaller arrays
        self.split = function (arr, size) {
            var arrays = [];
            while (arr.length > 0) {
                arrays.push(arr.splice(0, size));
            }
            return arrays;
        };

        self.onEventSourceChanged = function (value) {
            self.eventSource = value;
            if (self._onDataLoaded) {
                self._onDataLoaded();
            }
        };

        $scope.move = function (direction) {
            var step = self.mode.step,
                currentCalendarDate = self.currentCalendarDate,
                year = currentCalendarDate.getFullYear() + direction * (step.years || 0),
                month = currentCalendarDate.getMonth() + direction * (step.months || 0),
                date = currentCalendarDate.getDate() + direction * (step.days || 0),
                firstDayInNextMonth;

            currentCalendarDate.setFullYear(year, month, date);
            if ($scope.calendarMode === 'month') {
                firstDayInNextMonth = new Date(year, month + 1, 1);
                if (firstDayInNextMonth.getTime() <= currentCalendarDate.getTime()) {
                    self.currentCalendarDate = new Date(firstDayInNextMonth - 24 * 60 * 60 * 1000);
                }
            }
            ngModelCtrl.$setViewValue(self.currentCalendarDate);
            self.refreshView();
        };

        self.rangeChanged = function () {
            if (self.queryMode === 'local') {
                if (self.eventSource && self._onDataLoaded) {
                    self._onDataLoaded();
                }
            } else if (self.queryMode === 'remote') {
                if ($scope.rangeChanged) {
                    $scope.rangeChanged({
                        startTime: this.range.startTime,
                        endTime: this.range.endTime
                    });
                }
            }
        };

        function overlap(event1, event2) {
            if (event1.endIndex <= event2.startIndex || event2.endIndex <= event1.startIndex) {
                return false;
            }
            return true;
        }

        function calculatePosition(events) {
            var i,
                j,
                len = events.length,
                maxColumn = 0,
                col,
                isForbidden = new Array(len);

            for (i = 0; i < len; i += 1) {
                for (col = 0; col < maxColumn; col += 1) {
                    isForbidden[col] = false;
                }
                for (j = 0; j < i; j += 1) {
                    if (overlap(events[i], events[j])) {
                        isForbidden[events[j].position] = true;
                    }
                }
                for (col = 0; col < maxColumn; col += 1) {
                    if (!isForbidden[col]) {
                        break;
                    }
                }
                if (col < maxColumn) {
                    events[i].position = col;
                } else {
                    events[i].position = maxColumn++;
                }
            }
        }

        function calculateWidth(orderedEvents) {
            var cells = new Array(24),
                event,
                index,
                i;

            //sort by position in descending order, the right most columns should be calculated first
            orderedEvents.sort(function (eventA, eventB) {
                return eventB.position - eventA.position;
            });
            for (i = 0; i < 24; i += 1) {
                cells[i] = {
                    calculated: false,
                    events: []
                };
            }
            var len = orderedEvents.length;
            for (i = 0; i < len; i += 1) {
                event = orderedEvents[i];
                index = event.startIndex;
                while (index < event.endIndex) {
                    cells[index].events.push(event);
                    index += 1;
                }
            }

            i = 0;
            while (i < len) {
                event = orderedEvents[i];
                if (!event.overlapNumber) {
                    var overlapNumber = event.position + 1;
                    event.overlapNumber = overlapNumber;
                    var eventQueue = [event];
                    while ((event = eventQueue.shift())) {
                        index = event.startIndex;
                        while (index < event.endIndex) {
                            if (!cells[index].calculated) {
                                cells[index].calculated = true;
                                angular.forEach(cells[index].events, function (e) {
                                    if (!e.overlapNumber) {
                                        e.overlapNumber = overlapNumber;
                                        eventQueue.push(e);
                                    }
                                });
                            }
                            index += 1;
                        }
                    }
                }
                i += 1;
            }
        }

        self.placeEvents = function (orderedEvents) {
            calculatePosition(orderedEvents);
            calculateWidth(orderedEvents);
        };

        self.placeAllDayEvents = function (orderedEvents) {
            calculatePosition(orderedEvents);
        };
    }])
    .directive('calendar', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'bower_components/rcalendar/template/rcalendar/calendar.html',
            scope: {
                calendarMode: '=',
                rangeChanged: '&',
                eventSelected: '&',
                timeSelected: '&'
            },
            require: ['calendar', '?^ngModel'],
            controller: 'CalendarController',
            link: function (scope, element, attrs, ctrls) {
                var calendarCtrl = ctrls[0], ngModelCtrl = ctrls[1];

                if (ngModelCtrl) {
                    calendarCtrl.init(ngModelCtrl);
                }

                scope.$on('eventSourceChanged', function (event, value) {
                    calendarCtrl.onEventSourceChanged(value);
                });
            }
        };
    })
    .directive('monthview', ['dateFilter', function (dateFilter) {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'bower_components/rcalendar/template/rcalendar/month.html',
            require: ['^calendar', '?^ngModel'],
            link: function (scope, element, attrs, ctrls) {
                var ctrl = ctrls[0],
                    ngModelCtrl = ctrls[1];
                scope.showWeeks = ctrl.showWeeks;
                scope.showEventDetail = ctrl.showEventDetail;

                ctrl.mode = {
                    step: { months: 1 }
                };

                function getDates(startDate, n) {
                    var dates = new Array(n), current = new Date(startDate), i = 0;
                    current.setHours(12); // Prevent repeated dates because of timezone bug
                    while (i < n) {
                        dates[i++] = new Date(current);
                        current.setDate(current.getDate() + 1);
                    }
                    return dates;
                }

                scope.select = function (selectedDate) {
                    var rows = scope.rows;
                    if (rows) {
                        var currentCalendarDate = ctrl.currentCalendarDate;
                        var currentMonth = currentCalendarDate.getMonth();
                        var currentYear = currentCalendarDate.getFullYear();
                        var selectedMonth = selectedDate.getMonth();
                        var selectedYear = selectedDate.getFullYear();
                        var direction = 0;
                        if (currentYear === selectedYear) {
                            if (currentMonth !== selectedMonth) {
                                direction = currentMonth < selectedMonth ? 1 : -1;
                            }
                        } else {
                            direction = currentYear < selectedYear ? 1 : -1;
                        }

                        ctrl.currentCalendarDate = selectedDate;
                        if (ngModelCtrl) {
                            ngModelCtrl.$setViewValue(selectedDate);
                        }
                        if (direction === 0) {
                            for (var row = 0; row < 6; row += 1) {
                                for (var date = 0; date < 7; date += 1) {
                                    var selected = ctrl.compare(selectedDate, rows[row][date].date) === 0;
                                    rows[row][date].selected = selected;
                                    if (selected) {
                                        scope.selectedDate = rows[row][date];
                                    }
                                }
                            }
                        } else {
                            ctrl.refreshView();
                        }

                        if (scope.timeSelected) {
                            scope.timeSelected({selectedTime: selectedDate});
                        }
                    }
                };

                ctrl._refreshView = function () {
                    var startDate = ctrl.range.startTime,
                        date = startDate.getDate(),
                        month = (startDate.getMonth() + (date !== 1 ? 1 : 0)) % 12,
                        year = startDate.getFullYear() + (date !== 1 && month === 0 ? 1 : 0);

                    var days = getDates(startDate, 42);
                    for (var i = 0; i < 42; i++) {
                        days[i] = angular.extend(createDateObject(days[i], ctrl.formatDay), {
                            secondary: days[i].getMonth() !== month
                        });
                    }

                    scope.labels = new Array(7);
                    for (var j = 0; j < 7; j++) {
                        scope.labels[j] = dateFilter(days[j].date, ctrl.formatDayHeader);
                    }

                    var headerDate = new Date(year, month, 1);
                    scope.$parent.title = dateFilter(headerDate, ctrl.formatMonthTitle);
                    scope.rows = ctrl.split(days, 7);

                    if (scope.showWeeks) {
                        scope.weekNumbers = [];
                        var weekNumber = getISO8601WeekNumber(scope.rows[0][0].date),
                            numWeeks = scope.rows.length,
                            len = 0;
                        while (len < numWeeks) {
                            len = scope.weekNumbers.push(weekNumber);
                            weekNumber += 1;
                        }
                    }
                };

                function createDateObject(date, format) {
                    return {
                        date: date,
                        label: dateFilter(date, format),
                        selected: ctrl.compare(date, ctrl.currentCalendarDate) === 0,
                        current: ctrl.compare(date, new Date()) === 0
                    };
                }

                ctrl._onDataLoaded = function () {
                    var eventSource = ctrl.eventSource,
                        len = eventSource ? eventSource.length : 0,
                        startTime = ctrl.range.startTime,
                        endTime = ctrl.range.endTime,
                        timeZoneOffset = -new Date().getTimezoneOffset(),
                        utcStartTime = new Date(startTime.getTime() + timeZoneOffset * 60 * 1000),
                        utcEndTime = new Date(endTime.getTime() + timeZoneOffset * 60 * 1000),
                        rows = scope.rows,
                        oneDay = 24 * 3600 * 1000,
                        eps = 0.001;

                    for (var i = 0; i < len; i += 1) {
                        var event = eventSource[i];
                        var eventStartTime = new Date(event.startTime);
                        var eventEndTime = new Date(event.endTime);
                        var st;
                        var et;

                        if (event.allDay) {
                            if (eventEndTime <= utcStartTime || eventStartTime >= utcEndTime) {
                                continue;
                            } else {
                                st = utcStartTime;
                                et = utcEndTime;
                            }
                        } else {
                            if (eventEndTime <= startTime || eventStartTime >= endTime) {
                                continue;
                            } else {
                                st = startTime;
                                et = endTime;
                            }
                        }

                        var timeDifferenceStart;
                        if (eventStartTime <= st) {
                            timeDifferenceStart = 0;
                        } else {
                            timeDifferenceStart = (eventStartTime - st) / oneDay;
                        }

                        var timeDifferenceEnd;
                        if (eventEndTime >= et) {
                            timeDifferenceEnd = (et - st) / oneDay;
                        } else {
                            timeDifferenceEnd = (eventEndTime - st) / oneDay;
                        }

                        var index = Math.floor(timeDifferenceStart);
                        var eventSet;
                        while (index < timeDifferenceEnd - eps) {
                            var rowIndex = Math.floor(index / 7);
                            var dayIndex = Math.floor(index % 7);
                            rows[rowIndex][dayIndex].hasEvent = true;
                            eventSet = rows[rowIndex][dayIndex].events;
                            if (eventSet) {
                                eventSet.push(event);
                            } else {
                                eventSet = [];
                                eventSet.push(event);
                                rows[rowIndex][dayIndex].events = eventSet;
                            }
                            index += 1;
                        }
                    }

                    var findSelected = false;
                    for (var row = 0; row < 6; row += 1) {
                        for (var date = 0; date < 7; date += 1) {
                            if (rows[row][date].selected) {
                                scope.selectedDate = rows[row][date];
                                findSelected = true;
                                break;
                            }
                        }
                        if (findSelected) {
                            break;
                        }
                    }
                };

                ctrl.compare = function (date1, date2) {
                    return (new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()) - new Date(date2.getFullYear(), date2.getMonth(), date2.getDate()) );
                };

                ctrl._getRange = function getRange(currentDate) {
                    var year = currentDate.getFullYear(),
                        month = currentDate.getMonth(),
                        firstDayOfMonth = new Date(year, month, 1),
                        difference = ctrl.startingDay - firstDayOfMonth.getDay(),
                        numDisplayedFromPreviousMonth = (difference > 0) ? 7 - difference : -difference,
                        startDate = new Date(firstDayOfMonth),
                        endDate;

                    if (numDisplayedFromPreviousMonth > 0) {
                        startDate.setDate(-numDisplayedFromPreviousMonth + 1);
                    }

                    endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + 42);

                    return {
                        startTime: startDate,
                        endTime: endDate
                    };
                };

                function getISO8601WeekNumber(date) {
                    var checkDate = new Date(date);
                    checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7)); // Thursday
                    var time = checkDate.getTime();
                    checkDate.setMonth(0); // Compare with Jan 1
                    checkDate.setDate(1);
                    return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
                }

                ctrl.refreshView();
            }
        };
    }])
    .directive('weekview', ['dateFilter', '$timeout', function (dateFilter, $timeout) {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'bower_components/rcalendar/template/rcalendar/week.html',
            require: '^calendar',
            link: function (scope, element, attrs, ctrl) {
                $timeout(function () {
                    updateScrollGutter();
                });

                ctrl.mode = {
                    step: { days: 7 }
                };

                function updateScrollGutter() {
                    var children = element.children();
                    var allDayEventGutterWidth = 0;
                    var normalEventBody = children[2];
                    var normalEventGutterWidth = 0;
                    var gutterWidth = allDayEventGutterWidth || normalEventGutterWidth || 0;
                    if (gutterWidth > 0) {
                        scope.gutterWidth = gutterWidth;
                        if (allDayEventGutterWidth <= 0) {
                            scope.allDayEventGutterWidth = gutterWidth;
                        } else {
                            scope.allDayEventGutterWidth = 0;
                        }
                        if (normalEventGutterWidth <= 0) {
                            scope.normalGutterWidth = gutterWidth;
                        } else {
                            scope.normalGutterWidth = 0;
                        }
                    }
                }

                function getDates(startTime, n) {
                    var dates = new Array(n),
                        current = new Date(startTime),
                        i = 0;
                    current.setHours(12); // Prevent repeated dates because of timezone bug
                    while (i < n) {
                        dates[i++] = {
                            date: new Date(current)
                        };
                        current.setDate(current.getDate() + 1);
                    }
                    return dates;
                }

                function createDateObjects(startTime) {
                    var times = [],
                        row,
                        time = new Date(startTime.getTime());

                    for (var hour = 0; hour < 24; hour += 1) {
                        row = [];
                        for (var day = 0; day < 7; day += 1) {
                            time.setHours(time.getHours() + hour);
                            time.setDate(time.getDate() + day);
                            row.push({
                                time: new Date(time.getTime())
                            });
                        }
                        times.push(row);
                    }
                    return times;
                }

                ctrl._onDataLoaded = function () {
                    var eventSource = ctrl.eventSource,
                        len = eventSource ? eventSource.length : 0,
                        startTime = ctrl.range.startTime,
                        endTime = ctrl.range.endTime,
                        timeZoneOffset = -new Date().getTimezoneOffset(),
                        utcStartTime = new Date(startTime.getTime() + timeZoneOffset * 60 * 1000),
                        utcEndTime = new Date(endTime.getTime() + timeZoneOffset * 60 * 1000),
                        rows = scope.rows,
                        dates = scope.dates,
                        oneHour = 3600 * 1000,
                        oneDay = 24 * 3600 * 1000,
                    //add allday eps
                        eps = 0.016,
                        eventSet,
                        allDayEventInRange = false,
                        normalEventInRange = false;

                    for (var i = 0; i < len; i += 1) {
                        var event = eventSource[i];
                        var eventStartTime = new Date(event.startTime);
                        var eventEndTime = new Date(event.endTime);

                        if (event.allDay) {
                            if (eventEndTime <= utcStartTime || eventStartTime >= utcEndTime) {
                                continue;
                            } else {
                                allDayEventInRange = true;

                                var allDayStartIndex;
                                if (eventStartTime <= utcStartTime) {
                                    allDayStartIndex = 0;
                                } else {
                                    allDayStartIndex = Math.floor((eventStartTime - utcStartTime) / oneDay);
                                }

                                var allDayEndIndex;
                                if (eventEndTime >= utcEndTime) {
                                    allDayEndIndex = Math.ceil((utcEndTime - utcStartTime) / oneDay);
                                } else {
                                    allDayEndIndex = Math.ceil((eventEndTime - utcStartTime) / oneDay);
                                }

                                var displayAllDayEvent = {
                                    event: event,
                                    startIndex: allDayStartIndex,
                                    endIndex: allDayEndIndex
                                };

                                eventSet = dates[allDayStartIndex].events;
                                if (eventSet) {
                                    eventSet.push(displayAllDayEvent);
                                } else {
                                    eventSet = [];
                                    eventSet.push(displayAllDayEvent);
                                    dates[allDayStartIndex].events = eventSet;
                                }
                            }
                        } else {
                            if (eventEndTime <= startTime || eventStartTime >= endTime) {
                                continue;
                            } else {
                                normalEventInRange = true;

                                var timeDifferenceStart;
                                if (eventStartTime <= startTime) {
                                    timeDifferenceStart = 0;
                                } else {
                                    timeDifferenceStart = (eventStartTime - startTime) / oneHour;
                                }

                                var timeDifferenceEnd;
                                if (eventEndTime >= endTime) {
                                    timeDifferenceEnd = (endTime - startTime) / oneHour;
                                } else {
                                    timeDifferenceEnd = (eventEndTime - startTime) / oneHour;
                                }

                                var startIndex = Math.floor(timeDifferenceStart);
                                var endIndex = Math.ceil(timeDifferenceEnd - eps);
                                var startRowIndex = startIndex % 24;
                                var dayIndex = Math.floor(startIndex / 24);
                                var endOfDay = dayIndex * 24;
                                var endRowIndex;

                                do {
                                    endOfDay += 24;
                                    if (endOfDay <= endIndex) {
                                        endRowIndex = 24;
                                    } else {
                                        endRowIndex = endIndex % 24;
                                    }
                                    var displayEvent = {
                                        event: event,
                                        startIndex: startRowIndex,
                                        endIndex: endRowIndex
                                    };
                                    eventSet = rows[startRowIndex][dayIndex].events;
                                    if (eventSet) {
                                        eventSet.push(displayEvent);
                                    } else {
                                        eventSet = [];
                                        eventSet.push(displayEvent);
                                        rows[startRowIndex][dayIndex].events = eventSet;
                                    }
                                    startRowIndex = 0;
                                    dayIndex += 1;
                                } while (endOfDay < endIndex);
                            }
                        }
                    }

                    var day;
                    if (normalEventInRange) {
                        for (day = 0; day < 7; day += 1) {
                            var orderedEvents = [];
                            for (var hour = 0; hour < 24; hour += 1) {
                                if (rows[hour][day].events) {
                                    orderedEvents = orderedEvents.concat(rows[hour][day].events);
                                }
                            }
                            if (orderedEvents.length > 0) {
                                ctrl.placeEvents(orderedEvents);
                            }
                        }
                    }

                    if (allDayEventInRange) {
                        var orderedAllDayEvents = [];
                        for (day = 0; day < 7; day += 1) {
                            if (dates[day].events) {
                                orderedAllDayEvents = orderedAllDayEvents.concat(dates[day].events);
                            }
                        }
                        if (orderedAllDayEvents.length > 0) {
                            ctrl.placeAllDayEvents(orderedAllDayEvents);
                        }
                    }

                    $timeout(function () {
                        updateScrollGutter();
                    });
                };

                ctrl._refreshView = function () {
                    var firstDayOfWeek = ctrl.range.startTime,
                        dates = getDates(firstDayOfWeek, 7),
                        weekNumberIndex,
                        weekFormatPattern = 'w',
                        title;

                    scope.rows = createDateObjects(firstDayOfWeek);
                    scope.dates = dates;
                    weekNumberIndex = ctrl.formatWeekTitle.indexOf(weekFormatPattern);
                    title = dateFilter(firstDayOfWeek, ctrl.formatWeekTitle);
                    if (weekNumberIndex !== -1) {
                        title = title.replace(weekFormatPattern, getISO8601WeekNumber(firstDayOfWeek));
                    }
                    scope.$parent.title = title;
                };

                ctrl._getRange = function getRange(currentDate) {
                    var year = currentDate.getFullYear(),
                        month = currentDate.getMonth(),
                        date = currentDate.getDate(),
                        day = currentDate.getDay(),
                        firstDayOfWeek = new Date(year, month, date - day),
                        endTime = new Date(year, month, date - day + 7);

                    return {
                        startTime: firstDayOfWeek,
                        endTime: endTime
                    };
                };

                //This can be decomissioned when upgrade to Angular 1.3
                function getISO8601WeekNumber(date) {
                    var checkDate = new Date(date);
                    checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7)); // Thursday
                    var time = checkDate.getTime();
                    checkDate.setMonth(0); // Compare with Jan 1
                    checkDate.setDate(1);
                    return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
                }

                ctrl.refreshView();
            }
        };
    }])
    .directive('dayview', ['dateFilter', '$timeout', function (dateFilter, $timeout) {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'bower_components/rcalendar/template/rcalendar/day.html',
            require: '^calendar',
            link: function (scope, element, attrs, ctrl) {
                $timeout(function () {
                    updateScrollGutter();
                });

                ctrl.mode = {
                    step: { days: 1 }
                };

                function updateScrollGutter() {
                    var children = element.children();
                    var allDayEventBody = children[0].children[1];
                    var allDayEventGutterWidth = allDayEventBody.offsetWidth - allDayEventBody.clientWidth;
                    var normalEventBody = children[1];
                    var normalEventGutterWidth = normalEventBody.offsetWidth - normalEventBody.clientWidth;
                    var gutterWidth = allDayEventGutterWidth || normalEventGutterWidth || 0;
                    if (gutterWidth > 0) {
                        if (allDayEventGutterWidth <= 0) {
                            scope.allDayEventGutterWidth = gutterWidth;
                        } else {
                            scope.allDayEventGutterWidth = 0;
                        }
                        if (normalEventGutterWidth <= 0) {
                            scope.normalGutterWidth = gutterWidth;
                        } else {
                            scope.normalGutterWidth = 0;
                        }
                    }
                }

                function createDateObjects(startTime) {
                    var rows = [],
                        time = new Date(startTime.getTime());

                    for (var hour = 0; hour < 24; hour += 1) {
                        time.setHours(time.getHours() + hour);
                        time.setDate(time.getDate());
                        rows.push({
                            time: new Date(time.getTime())
                        });
                    }
                    return rows;
                }

                ctrl._onDataLoaded = function () {
                    var eventSource = ctrl.eventSource,
                        len = eventSource ? eventSource.length : 0,
                        startTime = ctrl.range.startTime,
                        endTime = ctrl.range.endTime,
                        timeZoneOffset = -new Date().getTimezoneOffset(),
                        utcStartTime = new Date(startTime.getTime() + timeZoneOffset * 60 * 1000),
                        utcEndTime = new Date(endTime.getTime() + timeZoneOffset * 60 * 1000),
                        rows = scope.rows,
                        allDayEvents = scope.allDayEvents,
                        oneHour = 3600 * 1000,
                        eps = 0.016,
                        eventSet,
                        normalEventInRange = false;

                    for (var i = 0; i < len; i += 1) {
                        var event = eventSource[i];
                        var eventStartTime = new Date(event.startTime);
                        var eventEndTime = new Date(event.endTime);

                        if (event.allDay) {
                            if (eventEndTime <= utcStartTime || eventStartTime >= utcEndTime) {
                                continue;
                            } else {
                                allDayEvents.push({
                                    event: event
                                });
                            }
                        } else {
                            if (eventEndTime <= startTime || eventStartTime >= endTime) {
                                continue;
                            } else {
                                normalEventInRange = true;
                            }

                            var timeDifferenceStart;
                            if (eventStartTime <= startTime) {
                                timeDifferenceStart = 0;
                            } else {
                                timeDifferenceStart = (eventStartTime - startTime) / oneHour;
                            }

                            var timeDifferenceEnd;
                            if (eventEndTime >= endTime) {
                                timeDifferenceEnd = (endTime - startTime) / oneHour;
                            } else {
                                timeDifferenceEnd = (eventEndTime - startTime) / oneHour;
                            }

                            var startIndex = Math.floor(timeDifferenceStart);
                            var endIndex = Math.ceil(timeDifferenceEnd - eps);

                            var displayEvent = {
                                event: event,
                                startIndex: startIndex,
                                endIndex: endIndex
                            };

                            eventSet = rows[startIndex].events;
                            if (eventSet) {
                                eventSet.push(displayEvent);
                            } else {
                                eventSet = [];
                                eventSet.push(displayEvent);
                                rows[startIndex].events = eventSet;
                            }
                        }
                    }

                    if (normalEventInRange) {
                        var orderedEvents = [];
                        for (var hour = 0; hour < 24; hour += 1) {
                            if (rows[hour].events) {
                                orderedEvents = orderedEvents.concat(rows[hour].events);
                            }
                        }
                        if (orderedEvents.length > 0) {
                            ctrl.placeEvents(orderedEvents);
                        }
                    }

                    $timeout(function () {
                        updateScrollGutter();
                    });
                };

                ctrl._refreshView = function () {
                    var startingDate = ctrl.range.startTime;

                    scope.rows = createDateObjects(startingDate);
                    scope.allDayEvents = [];
                    scope.dates = [startingDate];
                    scope.$parent.title = dateFilter(startingDate, ctrl.formatDayTitle);
                };

                ctrl._getRange = function getRange(currentDate) {
                    var year = currentDate.getFullYear(),
                        month = currentDate.getMonth(),
                        date = currentDate.getDate(),
                        startTime = new Date(year, month, date),
                        endTime = new Date(year, month, date + 1);

                    return {
                        startTime: startTime,
                        endTime: endTime
                    };
                };

                ctrl.refreshView();
            }
        };
    }]);