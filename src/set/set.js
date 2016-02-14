/**
 * @fileoverview VisFlow set base module.
 */

'use strict';

/**
 * @param {visflow.Node.Params} params
 * @constructor
 * @extends {visflow.Node}
 */
visflow.Set = function(params) {
  visflow.Set.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    'in': new visflow.MultiplePort({
      node: this,
      id: 'in',
      isInput: true,
      isConstants: false
    }),
    'out': new visflow.MultiplePort({
      node: this,
      id: 'out',
      isInput: false,
      isConstants: false
    })
  };

  /**
   * Stores the number of connections seen last time. If this has changed,
   * then in ports must have changed. So we can skip an inPortsChanged scan.
   * @private {number}
   */
  this.numConnections_ = 0;
};

visflow.utils.inherit(visflow.Set, visflow.Node);

/** @inheritDoc */
visflow.Set.prototype.RESIZABLE = false;
/** @inheritDoc */
visflow.Set.prototype.PANEL_TEMPLATE = './src/set/set-panel.html';

/** @protected {number} */
visflow.Set.prototype.MAX_LABEL_LENGTH = 9;

/** @inheritDoc */
visflow.Set.prototype.contextMenuItems = function() {
  return [
    {id: 'minimize', text: 'Minimize',
      icon: 'glyphicon glyphicon-resize-small'},
    {id: 'panel', text: 'Control Panel',
      icon: 'glyphicon glyphicon-th-list'},
    {id: 'delete', text: 'Delete', icon:
      'glyphicon glyphicon-remove'}
  ];
};

/** @inheritDoc */
visflow.Set.prototype.init = function() {
  visflow.Set.base.init.call(this);
  this.container.addClass('set');
};

/** @inheritDoc */
visflow.Set.prototype.initPanelHeader = function(container) {
  visflow.Set.base.initPanelHeader.call(this, container);
  container.find('.panel-header').find('#vis-mode').hide();
};

/**
 * Handles in port change event. This may be because of removed connections.
 * @return {boolean}
 */
visflow.Set.prototype.inPortsChanged = function() {
  if (this.numConnections_ != this.ports['in'].connections.length) {
    this.numConnections_ = this.ports['in'].connections.length;
    return true;
  }
  return visflow.Set.base.inPortsChanged.call(this);
};

/** @inheritDoc */
visflow.Set.prototype.show = function() {
  visflow.Set.base.show.call(this);
  this.showIcon();
};