/**
 * @fileoverview VisFlow FlowSense NLP extension.
 */

/** @const */
visflow.nlp = {};

/** @type {boolean} */
visflow.nlp.isWaitingForInput = false;

/** @type {boolean} */
visflow.nlp.isProcessing = false;

/** @type {visflow.Node|undefined} */
visflow.nlp.target = null;

/** @type {boolean} */
visflow.nlp.available = false;

/** @private @const {string} */
visflow.nlp.INPUT_TEMPLATE_ = './dist/html/nlp/nlp.html';

/**
 * Initializes NLP events.
 */
visflow.nlp.init = function() {
  $.post(visflow.url.NLP, {
    query: 'hello'
  }).done(function() {
    visflow.nlp.available = true;

    $('#backdrop')
      .mousedown(function() {
        if (visflow.nlp.isProcessing) { // Wait for server response.
          return;
        }
        visflow.nlp.end();
      });

    $('#nlp').on('keyup', 'textarea', function(event) {
      if (event.keyCode == visflow.interaction.keyCodes.ENTER) {
        // Submit entered text query.
        var textarea = $('#nlp textarea');
        textarea.prop('disabled', 'disabled');

        var text = /** @type {string} */(textarea.val());
        visflow.nlp.submit(text);
        textarea.val(text.replace(/\n/g, ''));

        return false; // prevent enter from going into the textarea
      } else if (event.keyCode == visflow.interaction.keyCodes.ESC) {
        visflow.nlp.end();
      }
    });

    // Initializes annyang speech recognition.
    visflow.nlp.initSpeech();
  }).fail(function() {
    // Disable speech button when NLP is unavailable.
    $(visflow.nlp.SPEECH_BUTTON_SELECTOR).prop('disabled', 'disabled');
  });
};

/**
 * Shows an input box for FlowSense input.
 * @param {(!visflow.Node|undefined)=} opt_target
 */
visflow.nlp.input = function(opt_target) {
  if (!visflow.nlp.available) {
    visflow.error('NLP service is currently unavailable');
    return;
  }
  visflow.nlp.isWaitingForInput = true;

  // If the input is global, search for a proper target.
  visflow.nlp.target = opt_target ? opt_target : visflow.nlp.findTarget();

  $('#nlp').load(visflow.nlp.INPUT_TEMPLATE_, function() {
    var div = $('#nlp').children('div')
      .css({
        left: visflow.interaction.mouseX,
        top: visflow.interaction.mouseY
      });
    div.find('.form-control').focus();
  });
  visflow.backdrop.toggle(true);
};

/**
 * Accepts NLP input from speech.
 * @param {string} query
 * @param {(!visflow.Node|undefined)=} opt_target
 */
visflow.nlp.speech = function(query, opt_target) {
  if (visflow.nlp.isWaitingForInput) {
    // If the NLP input box is open, then we direct the speech to the input box.
    var textarea = $('#nlp textarea');
    var text = textarea.val();
    textarea.val((text !== '' ? text + ' ' : '') + query);
    return;
  }
  // Search for a proper target.
  visflow.nlp.target = opt_target ? opt_target : visflow.nlp.findTarget();

  if (visflow.nlp.target == null) {
    visflow.nlp.end();
    return;
  }

  visflow.nlp.submit(query);
};

/**
 * Submits NLP query to the server.
 * @param {string} query
 */
visflow.nlp.submit = function(query) {
  visflow.nlp.isProcessing = true;

  // strip the query
  query = visflow.utils.strip(query);

  var rawQuery = query;
  query = visflow.nlp.processQuery_(query);

  $.post(visflow.url.NLP, {
    query: escape(query)
  }).done(function(res) {
    if (!visflow.nlp.parseResponse_(res, rawQuery)) {
        var failedMessage = $('#nlp .failed').show();
        failedMessage.children('.query').text(rawQuery);

        visflow.utils.shake($('#nlp .nlp-input'));

        $('#nlp textarea').prop('disabled', '');
        return;
      }
      $('#nlp .failed').hide();
      visflow.nlp.end();
      visflow.nlp.isProcessing = false;
    })
    .fail(function(res) {
      visflow.error('failed to execute FlowSense:', res.responseText);
      visflow.nlp.isProcessing = false;
    });
};

/**
 * Processes the NLP query. Puts in placeholders for chart types and dimensions.
 * Removes stop words.
 * @param {string} query
 * @return {string}
 * @private
 */
visflow.nlp.processQuery_ = function(query) {
  console.log('[target]', visflow.nlp.target);
  query = visflow.nlp.matchUtterances(query);
  console.log('[query]', query);
  return query;
};

/**
 * Parses the NLP response.
 * @param {string} res HTML response of NLP query.
 * @param {string} query Query parsed.
 * @return {boolean} Whether query is successfully understood.
 * @private
 */
visflow.nlp.parseResponse_ = function(res, query) {
  if (res.match(/: 0 candidates/) != null) {
    visflow.nlp.log_(query, '0 candidates');
    return false;
  }

  var matched = res.match(/Top value \{\n\s*\(string\s*(\S.*\S)\s*\)/);
  if (matched == null) {
    visflow.error('unexpected NLP response');
    console.log(res);
    visflow.nlp.log_(query, 'unexpected');
    return false;
  }
  var result = matched[1];
  if (result[0] == '"') {
    result = result.match(/"(.*)"/)[1]; // Remove string quotes
  }

  // Successful query log
  visflow.nlp.log_(query, result);

  console.log('[response]', result);
  var commands = visflow.nlp.mapUtterances(result);
  console.log('[command]', commands.map(function(command) {
    return command.token;
  }).join(' '));
  visflow.nlp.execute(commands);
  return true;
};

/**
 * Ends the NLP input.
 */
visflow.nlp.end = function() {
  $('#nlp').children().remove();
  visflow.backdrop.toggle(false);
  visflow.nlp.isWaitingForInput = false;
};

/**
 * Logs the NLP query for back study.
 * @param {string} query
 * @param {string} result
 * @private
 */
visflow.nlp.log_ = function(query, result) {
  $.post(visflow.url.NLP_LOG, {
    query: query,
    result: result
  });
};
