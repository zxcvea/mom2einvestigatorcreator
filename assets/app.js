$(document).ready(function() {
  App.Run();
});

var userImageUrl = null; 
var userImageData = null;
var investigatorData = [];
var currentInvestigatorData = {};
var maxInvestigators = 8;

var App = {

  Run: function() {
    Interface.Bind();
    UploadImage.Bind();
    Data.Init();
  }

};

var Interface = {

  Events: function() {

    $(document).on('click', '#update', function(){
      Template.Update();
    });

    $(document).on('click', '#save-front', function(){
      const element = document.getElementById("card-front");
      const saveAsPng = $('#checkbox-imagetype').is(':checked');
      Template.SaveAsImage(element, 'investigator-card-front.jpg', saveAsPng);
    });

    $(document).on('click', '#save-back', function(){
      const element = document.getElementById("card-back");
      const saveAsPng = $('#checkbox-imagetype').is(':checked');
      Template.SaveAsImage(element, 'investigator-card-back.jpg', saveAsPng);
    });

    $(document).on('click', '#save-image', function(){
      if ($('#card-front').is(':visible')) {
        const element = document.getElementById("card-front");
        const saveAsPng = $('#checkbox-imagetype').is(':checked');
        Template.SaveAsImage(element, 'investigator-card-front.jpg', saveAsPng);
      } else if ($('#card-back').is(':visible')) {
        const element = document.getElementById("card-back");
        const saveAsPng = $('#checkbox-imagetype').is(':checked');
        Template.SaveAsImage(element, 'investigator-card-back.jpg', saveAsPng);
      }
    });

    $(document).on('click', '#save', function(){
      Data.SaveInvestigator();
      if (!$('#offcanvasDrawer').hasClass('show')) {
        $('#manage').click();
      }
    });

    $(document).on('click', '.edit-investigator', function(){
      var index = parseInt($(this).attr('data-index'));
      Data.EditInvestigator(index);
    });

    $(document).on('click', '.delete-investigator', function(){
      var index = parseInt($(this).attr('data-index'));
      Data.DeleteInvestigator(index);
    });

    $(document).on('click', '#export', function(){
      const jsonString = JSON.stringify(investigatorData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'investigator-data.json';
      document.body.appendChild(a);
      a.click();

      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });

    $('.input-data').change(function() {
      var text = $(this).val();
      var ref = $(this).data('ref');
      if (ref) {
        if (ref === 'profile-image') {
          if (userImageData && !text) {
            $('#' + ref + ' img').attr('src', userImageData);
          } else {
            $('#' + ref + ' img').attr('src', text ? text : 'img/profile-generic-male.webp');
          }
        } else if ($(this).is('input')) {
          $('#' + ref).text(text);
        } else if ($(this).is('textarea')) {
          var formattedText = ref === 'ability' ? Data.Replace(text) : Data.Format(text);
          $('#' + ref).html(formattedText);
        }
      }
    });

    $(document).on('change', '.form-select', function() {
      var selectedValue = $(this).find('option:selected').val();
      var ref = $(this).attr('data-ref');
      var className = (ref.includes('stats')) ? `stat-${selectedValue}` : `attribute-${selectedValue}`;
      $(`#${ref}`).removeClass().addClass(className).addClass('card-hover');
    });

    $(document).on('click', '.card-hover', function() {
      var focusId = $(this).data('focus');
      if (focusId) {
        $(".form-group").removeClass('active');
        $("#" + focusId).parent().addClass('active');
        var $accordionParent = $("#" + focusId).parents('.accordion-collapse');
        var index = $('.accordion-collapse').index($accordionParent);
        $('.accordion-collapse:not(:eq(' + index + '))').collapse('hide');
        $accordionParent.collapse('show');
        $("#" + focusId).focus();
      }
    });

    $(document).on('mouseleave', '.form-group', function() {
      $(this).removeClass('active');
    });

    $(document).on('click', '#view-back', function(){
      if (!$(this).hasClass('active')) {
        $(this).addClass('active');
        $('#view-front').removeClass('active');
        $('#card-back').show();
        $('#card-front').hide();
      }
    });

    $(document).on('click', '#view-front', function(){
      if (!$(this).hasClass('active')) {
        $(this).addClass('active');
        $('#view-back').removeClass('active');
        $('#card-back').hide();
        $('#card-front').show();
      }
    });

    $(document).on('click', '#expand', function(){
      Interface.ExpandSideCol();
    });

    $(document).on('click', '#expand-close', function(){
      Interface.ExpandSideCol();
    });

    $(document).on('click', '#load', function(){
      $('#jsonFileInput').click();
    });

    $(document).on('change', '#jsonFileInput', function(event){
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();  
        reader.onload = function(e) {
          try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
              investigatorData = importedData;
              Data.RefreshInvestigatorList();
              localStorage.setItem('investigator.data', JSON.stringify(investigatorData));
              if (investigatorData.length > 0) {
                currentInvestigatorData = investigatorData[0];
                Data.LoadData(currentInvestigatorData);
              } else {
                currentInvestigatorData = {};
              }
              $('#alert-message').text('Investigator data imported successfully.').removeClass().addClass('alert alert-success');
              $('.alert-modal').modal('show');
            } else {
              throw new Error('Invalid data format');
            }
          } catch (error) {
            $('#alert-message').text('Error importing investigator data: ' + error.message).removeClass().addClass('alert alert-danger');
            $('.alert-modal').modal('show');
          }
        };
        reader.readAsText(file);
      }
    });

  },

  ExpandSideCol: function() {
    var isExpandedSideCol = $('#expand').is(':visible');
    if (!isExpandedSideCol) return;
    var isExpanded = $('.column-1').hasClass('expanded');
    $('.column-1').animate({
      left: isExpanded ? -400 : 0
    }, 300, function() {
      if (isExpanded) {
        $('.column-1').removeClass('expanded');
        // $('.column-1').css({
        //   'position': 'absolute'
        // });
        $('#expand-close').hide();
        $('#expand i').removeClass('bi-chevron-double-left');
        $('#expand i').addClass('bi-chevron-double-right');
        $('.column-1').removeAttr('style');
      } else {
        $('.column-1').addClass('expanded');
        // $('.column-1').css({
        //   'position': 'fixed'
        // });
        $('#expand-close').show();
        $('#expand i').removeClass('bi-chevron-double-right');
        $('#expand i').addClass('bi-chevron-double-left');
      }
    });
  },

  Sortable: function() {
    $('#investigator-list').sortable({
      update: function( event, ui ) {
        var newOrder = [];
        $('#investigator-list .btn-group').each(function() {
          var index = parseInt($(this).attr('data-index'));
          newOrder.push(investigatorData[index]);
        });
        investigatorData = newOrder;
        Data.RefreshInvestigatorList();
        localStorage.setItem('investigator.data', JSON.stringify(investigatorData));
      }
    });
  },

  Bind: function() {
    Interface.Events();
    Interface.Sortable();
  }

};

var Template = {

  Update: function() {

    $('#profile-name').text($('#input-name').val());
    $('#profile-job').text($('#input-job').val());

    var ability = Data.Replace($('#input-ability').val());
    $('#ability').html(ability);

    var story = Data.Format($('#input-story').val());
    $('#story').html(story);

    var damage = $("#select-health option:selected").text();   
    var horror = $("#select-sanity option:selected").text();

    var strength = $("#select-strength option:selected").text();
    var agility = $("#select-agility option:selected").text();
    var observation = $("#select-observation option:selected").text();
    var lore = $("#select-lore option:selected").text();
    var influence = $("#select-influence option:selected").text();
    var will = $("#select-will option:selected").text();

    $('#stats-damage').removeClass();
    $('#stats-horror').removeClass();

    $('#attributes-strength').removeClass();
    $('#attributes-agility').removeClass();
    $('#attributes-observation').removeClass();
    $('#attributes-lore').removeClass();
    $('#attributes-influence').removeClass();
    $('#attributes-will').removeClass();

    $('#stats-damage').addClass('card-hover').addClass('stat-' + damage);
    $('#stats-horror').addClass('card-hover').addClass('stat-' + horror);

    $('#attributes-strength').addClass('card-hover').addClass('attribute-' + strength);
    $('#attributes-agility').addClass('card-hover').addClass('attribute-' + agility);
    $('#attributes-observation').addClass('card-hover').addClass('attribute-' + observation);
    $('#attributes-lore').addClass('card-hover').addClass('attribute-' + lore);
    $('#attributes-influence').addClass('card-hover').addClass('attribute-' + influence);
    $('#attributes-will').addClass('card-hover').addClass('attribute-' + will);

    userImageUrl = $('#input-imageurl').val();
    
    if (userImageData && !userImageUrl) {
      $('#profile-image img').attr('src', userImageData);
    } else if (userImageUrl) {
      $('#profile-image img').attr('src', userImageUrl);
    } else {
      $('#profile-image img').attr('src', 'img/profile-generic-male.webp');
    }
    
    Data.SetCurrentInvestigatorData();

  },

  SaveAsImage: function(element, filename, saveAsPng = true) {
    html2canvas(element, {
      useCORS: true,
      scale: 2
    }).then(function(canvas) {
      var link = document.createElement('a');
      var dataUrl = saveAsPng ? canvas.toDataURL() : canvas.toDataURL('image/jpeg', 0.9);
      filename = saveAsPng ? filename.replace('.jpg', '.png') : filename;
      link.download = filename;
      link.href = dataUrl;
      link.click();
    });
  }

};

var UploadImage = {

  ReadFile: function(input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();

      reader.onload = function(e) {
        userImageData = e.target.result;
        var htmlPreview =
          '<img width="200" src="' + e.target.result + '" />' +
          '<p>' + input.files[0].name + '</p>';
        var wrapperZone = $(input).parent();
        var previewZone = $(input).parent().parent().find('.preview-zone');
        var boxZone = $(input).parent().parent().find('.preview-zone').find('.box').find('.box-body');

        wrapperZone.removeClass('dragover');
        previewZone.removeClass('hidden');
        boxZone.empty();
        boxZone.append(htmlPreview);
        $('.preview-zone').show();
        $('.dropzone-wrapper').hide();

        $('#input-imageurl').val('');
        $('#profile-image img').attr('src', e.target.result);
      };

      reader.readAsDataURL(input.files[0]);
    }
  },

  Reset: function(e) {
    e.wrap('<form>').closest('form').get(0).reset();
    e.unwrap();
    $('.preview-zone').hide();
    $('.dropzone-wrapper').show();
    userImageData = null;
    var text = $('#input-imageurl').val();
    $('#profile-image img').attr('src', text ? text : 'img/profile-generic-male.webp');
  },

  Events: function() {

    $('.dropzone').change(function() {
      UploadImage.ReadFile(this);
    });

    $('.dropzone-wrapper').on('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).addClass('dragover');
    });

    $('.dropzone-wrapper').on('dragleave', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).removeClass('dragover');
    });

    $('.remove-preview').on('click', function() {
      var boxZone = $(this).parents('.preview-zone').find('.box-body');
      var previewZone = $(this).parents('.preview-zone');
      var dropzone = $(this).parents('.form-group').find('.dropzone');
      boxZone.empty();
      previewZone.addClass('hidden');
      UploadImage.Reset(dropzone);
    });

  },

  Bind: function() {
    UploadImage.Events();
  }

};


var Data = {

  Replace: function (text) {
    text = text.replace(/\\n/g, '<br />');
    text = text.replace(/\{\{/g, '<strong>');
    text = text.replace(/\}\}/g, '</strong>');
    text = text.replace(/\{action\}/g, '<strong>Action:</strong>');
    text = text.replace(/\{focused\}/g, '<strong>focused</strong>');
    text = text.replace(/\{dazed\}/g, '<strong>dazed</strong>');
    text = text.replace(/\{fearless\}/g, '<strong>fearless</strong>');
    text = text.replace(/\{mesmerized\}/g, '<strong>mesmerized</strong>');
    text = text.replace(/\{poisoned\}/g, '<strong>poisoned</strong>');
    text = text.replace(/\{restrained\}/g, '<strong>restrained</strong>');
    text = text.replace(/\{righteous\}/g, '<strong>righteous</strong>');
    text = text.replace(/\{stressed\}/g, '<strong>stressed</strong>');
    text = text.replace(/\{stunned\}/g, '<strong>stunned</strong>');
    text = text.replace(/\{wounded\}/g, '<strong>wounded</strong>');
    text = text.replace(/\{insane\}/g, '<strong>insane</strong>');
    text = text.replace(/\{strength\}/g, '<span class="strength"></span>');
    text = text.replace(/\{agility\}/g, '<span class="agility"></span>');
    text = text.replace(/\{observation\}/g, '<span class="observation"></span>');
    text = text.replace(/\{lore\}/g, '<span class="lore"></span>');
    text = text.replace(/\{influence\}/g, '<span class="influence"></span>');
    text = text.replace(/\{will\}/g, '<span class="will"></span>');
    text = text.replace(/\{\?\}/g, '<span class="investigation"></span>');
    text = text.replace(/\{success\}/g, '<span class="success"></span>');
    return text;
  },

  Format: function(text) {
    text = text.replace('\n\n', '<br /><br />');
    text = text.replace(/\\n/g, '<br />');
    text = text.replace(/\[/g, '<i>&quot;');
    text = text.replace(/\]/g, '&quot;</i>');
    text = text.replace(/\{/g, '<strong>');
    text = text.replace(/\}/g, '</strong>');
    return text;
  },
  
  Init: function() {
    var savedData = localStorage.getItem('investigator.data');
    if (savedData) {
      investigatorData = JSON.parse(savedData);
      Data.RefreshInvestigatorList();
      currentInvestigatorData = investigatorData[0];
      Data.LoadData(currentInvestigatorData);
    }
  },

  LoadData: function(data) {
    if (data.Image && data.Image.startsWith('http') || data.Image.startsWith('img')) {
      $('#input-imageurl').val(data.Image);
    }
    
    $('#input-name').val(data.Name);
    $('#input-job').val(data.Job);
    $('#input-ability').val(data.Ability);
    $('#input-story').val(data.Story);
    $("#select-health").val(data.Stats.Damage);
    $("#select-sanity").val(data.Stats.Horror);
    $("#select-strength").val(data.Attributes.Strength);
    $("#select-agility").val(data.Attributes.Agility);
    $("#select-observation").val(data.Attributes.Observation);
    $("#select-lore").val(data.Attributes.Lore);
    $("#select-influence").val(data.Attributes.Influence);
    $("#select-will").val(data.Attributes.Will);
    Template.Update();
  },

  SetCurrentInvestigatorData: function() {

    currentInvestigatorData = {
      "Name": $('#input-name').val(),
      "Job": $('#input-job').val(),
      "Image": userImageUrl ? userImageUrl : "img/profile-generic-male.webp",
      "Ability": $('#input-ability').val(),
      "Story": $('#input-story').val(),
      "Stats": {
        "Damage": parseInt($("#select-health option:selected").text()),
        "Horror": parseInt($("#select-sanity option:selected").text())
      },
      "Attributes": {
        "Strength": parseInt($("#select-strength option:selected").text()),   
        "Agility": parseInt($("#select-agility option:selected").text()),
        "Observation": parseInt($("#select-observation option:selected").text()),
        "Lore": parseInt($("#select-lore option:selected").text()),
        "Influence": parseInt($("#select-influence option:selected").text()),
        "Will": parseInt($("#select-will option:selected").text())
      }
    };

    //const buf = fflate.strToU8(JSON.stringify(currentInvestigatorData, null, 2));
    //const compressed = fflate.compressSync(buf, { level: 6, mem: 4 });

    $('#code-data').text(JSON.stringify(currentInvestigatorData, null, 2));
    //$('#code-compressed').text(JSON.stringify(compressed));

  },

  SaveInvestigator: function() {
    Template.Update();

    let message = 'Investigator has been saved.';
    if (investigatorData.some(inv => inv.Name === currentInvestigatorData.Name)) {
      var index = investigatorData.findIndex(inv => inv.Name === currentInvestigatorData.Name);
      investigatorData[index] = currentInvestigatorData;
      message = 'Investigator has been updated.';
      $('#alert-message').text(message).removeClass().addClass('alert alert-success');
      $('.alert-modal').modal('show');
      Interface.ExpandSideCol();
    } else if (investigatorData.length >= maxInvestigators) {
      message = 'Cannot save Investigator. The maximum number of investigators that can be saved (' + maxInvestigators + ') has been reached. Please remove an investigator before adding another.';
      $('#alert-message').text(message).removeClass().addClass('alert alert-danger');
      $('.alert-modal').modal('show');
    } else if (
      investigatorData.length < maxInvestigators &&
      !investigatorData.some(inv => inv.Name === currentInvestigatorData.Name) &&
      Object.keys(currentInvestigatorData).length > 0
    ) {
      investigatorData.push(currentInvestigatorData);
      $('#alert-message').text(message).removeClass().addClass('alert alert-success');
      $('.alert-modal').modal('show');
      Interface.ExpandSideCol();
    }

    localStorage.setItem('investigator.data', JSON.stringify(investigatorData));

    Data.RefreshInvestigatorList();
  },

  RefreshInvestigatorList: function() {
    var list = $('#investigator-list');
    list.empty();

    if (investigatorData.length === 0) {
      list.append('<p>No investigators saved.</p>');
      return;  
    }

    investigatorData.forEach(function(inv, index) {
      var listItem = `
        <div class="btn-group full-width mb-1" data-index="${index}">
          <div class="sort-grip"><i class="bi bi-grip-vertical"></i></div>
          <div class="div-group"><i class="bi bi-person"></i> <a href="javascript:void(0);" class="edit-investigator" data-index="${index}">${inv.Name}</a></div>
          <button type="button" class="btn btn-outline-secondary icon-button edit-investigator" data-index="${index}"><i class="bi bi-pen"></i></button>
          <button type="button" class="btn btn-outline-secondary icon-button delete-investigator" data-index="${index}"><i class="bi bi-trash"></i></button>
        </div>
      `;
      list.append(listItem);
    });
  },

  EditInvestigator: function(index) {
    var investigator = investigatorData[index];
    Data.LoadData(investigator);
    userImageUrl = null; 
    userImageData = null;

    $('html, body').animate({
      scrollTop: 0
    }, 300);
  },

  DeleteInvestigator: function(index) {
    investigatorData.splice(index, 1);
    Data.RefreshInvestigatorList();
    localStorage.setItem('investigator.data', JSON.stringify(investigatorData));
  }

};
