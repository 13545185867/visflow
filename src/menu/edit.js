/** @const */
visflow.edit = {};

/**
 * Initializes edit dropdown.
 * @param {!jQuery} navbar
 */
visflow.edit.initDropdown = function(navbar) {
  var edit = navbar.find('#edit');
  edit.find('#undo').click(function() {
    visflow.history.undo();
  });
  edit.find('#redo').click(function() {
    visflow.history.redo();
  });
  edit.find('#minimize-non-vis').click(function() {
    visflow.flow.minimizeNonVisualizations();
  });
  edit.find('#auto-layout').click(function() {
    visflow.flow.autoLayoutAll();
  });

  visflow.edit.initListeners_(navbar);
};

/**
 * Initializes listeners for edit dropdown.
 * @param {!jQuery} navbar
 * @private
 */
visflow.edit.initListeners_ = function(navbar) {
  var edit = navbar.find('#edit');
  var undo = edit.find('#undo');
  var redo = edit.find('#redo');
  $(visflow.history)
    .on('vf.push', function() {
      undo.removeClass('disabled');
      redo.addClass('disabled');
    })
    .on('vf.noUndo', function() {
      undo.addClass('disabled');
    })
    .on('vf.noRedo', function() {
      redo.addClass('disabled');
    });
};
