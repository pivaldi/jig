define([
         "dojo/_base/declare",
         "../../_Widget",
         "../../util/promise",
         "../../util/widget",
         "../../button/Action",
         "dojo/_base/lang",
         "dojo/_base/window",
], function(declare, _Widget, promise, widget, util, Action, lang, window) {


/**
 * Base class for all data panes
 *
 * A data pane is a widget whose role is to "manage" a model object.
 *
 * It is typically a display, which can embed some editing/action
 * functionnalities.
 *
 * For a pure editor (form), geonef.jig.data.editor.AbstractEditor
 * would better fit (form/validation/saving management).
 *
 * This handles init/load/events around this.object.
 */
return declare('geonef.jig.data.pane.AbstractDataPane', _Widget,
{
  /**
   * @override
   */
  'class': _Widget.prototype['class'] + ' jigDataPane',

  /**
   * The model object - mandatory, must be given at construction
   *
   * @type {geonef.jig.data.model.Abstract}
   */
  object: null,

  /**
   * Properties to fetch
   *
   * @type {Array.<string>} autoRequestProps
   */
  autoRequestProps: [],

  /**
   * Is data ready? Set to true once 'autoRequestProps' have been loaded.
   */
  isDataReady: false,

  removeConfirm: "Vraiment supprimer cet objet ?",


  /**
   * @override
   */
  postMixInProperties: function() {
    this.inherited(arguments);
    this.whenDataReady = this.autoRequestProps.length > 0 ?
      this.object.requestProps(this.autoRequestProps) : promise.newResolved();
  },

  /**
   * @override
   */
  buildRendering: function() {
    this.inherited(arguments);
    this.whenDataReady.then(widget.busy(this.domNode));
  },

  makeDropDownNode: function(title) {
    var _this = this;

    var node = this.dom(
      [dijit.form.DropDownButton, {
         _attach: 'optionsDD',
         'class': 'nolabel gear',
         dropDown: new dijit.TooltipDialog({'class': 'jigActionsTooltip jigDataPaneTooltip'}),
         onMouseEnter: lang.hitch(null, domClass.add, this.domNode, 'overDD'),
         onMouseLeave: lang.hitch(null, domClass.remove, this.domNode, 'overDD'),
       }]);

    this.dom(
      ['div', { _insert: this.optionsDD.dropDown.containerNode },
       [['h2', {}, title || ""],
        ['div', {'class':'actions'}, this.makeOptions()]]]);

    return node;
  },

  makeOptions: function() {
    return [
      [Action, {
         label: "Supprimer",
         iconClass: 'remove',
         onExecute: promise.deferHitch(this, this.deleteObject),
       }],
    ];
  },

  /**
   * @override
   */
  postCreate: function() {
    this.inherited(arguments);
    this.subscribe(this.object.channel, this.onModelChannel);
  },

  /**
   *  @override
   */
  startup: function() {
    this.inherited(arguments);
    this.whenDataReady.then(lang.hitch(this, this.onDataReady));
  },

  /**
   * Called after model data is ready (props are fetched)
   */
  onDataReady: function() {
    this.isDataReady = true;
    this.onModelChange();
    this.afterModelChange();
  },

  /**
   * Model channel subscriber (registered in 'postCreate')
   *
   * @param {geonef.jig.data.model.Abstract} object
   * @param {string} type
   */
  onModelChannel: function(object, type) {
    if (object !== this.object || this._destroyed) { return; }
    // console.log('dataPane::onModelChannel', this, type);
    if (type === 'put') {
      this.onModelChange();
    }
    if (type === 'afterPut') {
      this.afterModelChange();
    }
    if (type === 'delete') {
      this.destroy();
    }
  },

  /**
   * Hook - when the model object has changed
   *
   * It should be used by child classed to make custom updates if needed.
   */
  onModelChange: function(saving) {
    // this.panelPath = ["Ressources", this.object.getSummary()];
    this.onPanelPathChange();
  },

  /**
   * Hook - called after changes have been saved
   */
  afterModelChange: function(saving) {
  },

  onPanelPathChange: function() {},

  /** hook */
  onClose: function() {
  },

  deleteObject: function() {
    if (!window.global.confirm(this.removeConfirm)) { return; }
    this.object.store.remove(this.object)
      .then(widget.busy(this.domNode));
  },

});

});
