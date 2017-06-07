var calcGridOptions = {
  columns: 6,
  pushing: true,
  floating: true,
  swapping: true,
  width: 'auto',
  colWidth: 'auto',
  rowHeight: '25%',
  margins: [9, 9],
  outerMargin: true,
  sparse: false,
  isMobile: false,
  mobileBreakPoint: 600,
  mobileModeEnabled: false,
  defaultSizeX: 1,
  defaultSizeY: 1,
  resizable: {
    enabled: false,
  },
  draggable: {
    enabled: false,
    stop: function(event, $element, widget) {
      console.log($element.scope().gridster.grid);
      // console.log($element.scope().gridster.grid);
    }
  }
};

