//'use strict';
console.log("lhstoc.js");
var production = false;

var util = 
{
	debug:function(message)
	{
        if (production !== true )
        {
			console.log(arguments.callee.caller.name + "():\t" + message);
			//console.log("debug:" + message);
		}
	},

	inject_css:function(filename)
	{
		var style = document.createElement('link');
		style.rel = 'stylesheet';
		style.type = 'text/css';
		//style.href = chrome.extension.getURL(filename);
		style.href = filename;
		(document.head||document.documentElement).appendChild(style);
	},

    pixels_to_int:function(a)
    {
        var pixels = parseInt(a);
        
        if ( pixels >= 0)
        {
            return pixels;
        } else 
        {
            util.debug("Invalid pixel value here: " + a);
            return null;
        }
    },
    
    pixels_addition:function(a, b)
    {
        var pixels_a = util.pixels_to_int(a);
        var pixels_b = util.pixels_to_int(b);
        
        return pixels_a + pixels_b;
    },
    
    pixels_subtraction:function(a, b)
    {
        var pixels_a = util.pixels_to_int(a);
        var pixels_b = util.pixels_to_int(b);
        
        return pixels_a - pixels_b;
    },

};

var lhstoc=
{
    o: {},
    is_valid_wiki_page:function() 
    {
        var is_valid = false;
        if ($("#toc").length === 0 ||  
            $("#left-navigation").length === 0 || 
            $("#content").length === 0 || 
            $("#toctitle").length === 0 ||
            $("#footer").length === 0)
        {
            is_valid = false; //doesnt look like a valid wikimedia page
        }
        else 
        {
            is_valid = true; //looks like a valid wikimedia page
        }

        return is_valid;
    },

    init_lhstoc:function()
    {
        var cloned_toc = $("#toc").clone().attr('id', 'lhstoc');
        cloned_toc.addClass("toc");
        cloned_toc.addClass("mw-body-content");
        cloned_toc.find('.toctoggle').remove();
        cloned_toc.insertAfter("#p-lang");
		$("#lhstoc #toctitle").remove();
		$("#lhstoc ul").css("display", ""); //restore #lhstoc just in case it's hidden

        //$("#lhstoc").addClass("ui-resizable");
        $("#lhstoc").addClass("ui-resizable-e");

        $('#toc').resizable({
			handles: "e",
        });
		var that = this;
        $('#lhstoc').resizable({
			handles: "e",
          stop: function(e, ui){
              console.log("lhstoc resized");
			  that.event_update_content_margin();
            },
        });

        $("#lhstoc").addClass("sidebar");
        $("#lhstoc").addClass("left");
        $("#lhstoc").sidebar({side: "left"}); 

		//var toc_height = window.innerHeight.toString() + "px";
        //$("#lhstoc").css("height",  toc_height);

	},

    init_lhstoc_button:function()
	{
		//#btn_toggle
		var btn_toggle = document.createElement('button');
		btn_toggle.setAttribute("id", "btn_toggle");
		var htmltext = document.createTextNode("Toggle Table of Contents");
		btn_toggle.appendChild(htmltext);

		//#btn_div
		var btn_div = document.createElement('div');
		btn_div.setAttribute("id", "btn_div");
		btn_div.appendChild(btn_toggle);
		$("#mw-navigation")[0].appendChild(btn_div);

		$("#btn_toggle>span").css("-ms-transform", "scale(1.5)"); /* IE 9 */
		$("#btn_toggle>span").css("-webkit-transform", "scale(1.5)"); /* Chrome, Safari, Opera */
		$("#btn_toggle>span").css("transform", "scale(1.5)"); 

		$("#btn_div").css("position", "relative");

		$("#btn_toggle").on("click", this.lhstoc_toggle);
    },

    init_lhstoc_margin:function(margin)
	{
		util.debug("margin:" + margin);
		$("#lhstoc").css("width", margin);
	},

	lhstoc_toggle:function(o) 
	{
		util.debug("lhstoc_toggle()");
		$("#lhstoc").trigger("sidebar:toggle");
		var that = this;
		chrome.storage.sync.get("lhstoc_on_lhs", function(item){
			if (item["lhstoc_on_lhs"] === true)
			{
				util.debug("lhstoc on lhs");
				that.lhstoc_hide();
			}
			else
			{
				util.debug("lhstoc NOT on lhs");
				that.lhstoc_show();
			}
		});
	},

	lhstoc_show:function()
	{
		chrome.storage.sync.set({"lhstoc_on_lhs": true});
		util.debug("lhstoc_show()");
		$("#lhstoc").trigger("sidebar:open");
	},

	lhstoc_hide:function()
	{
		chrome.storage.sync.set({"lhstoc_on_lhs": false});
		util.debug("lhstoc_hide()");
		$("#lhstoc").trigger("sidebar:close");
	},

    init:function()
	{
		var that = this;
		util.inject_css("https://code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.css");

		this.o.events = {}; //stores hash of event handlers
		chrome.storage.sync.get( null , function (items) {
			for (var key in items)
			{
				util.debug("get " + key + ": " + items[key]);
			}	
			var lhstoc_enabled = true;
			var lhstoc_on_lhs =  true;
			var lhstoc_margin =  "270px";

			if ("lhstoc_enabled" in items)
				lhstoc_enabled = items["lhstoc_enabled"];
			if ("lhstoc_on_lhs" in items)
				lhstoc_on_lhs =  items["lhstoc_on_lhs"];
			if ("lhstoc_margin" in items)
				lhstoc_margin =  items["lhstoc_margin"];

			util.debug("margin" + lhstoc_margin);
			if (lhstoc_enabled === true)
			{
				$( document ).ready(function() {
					that.init_lhstoc();
					that.init_lhstoc_button();
					that.init_lhstoc_margin(lhstoc_margin);
					that.event_update_content_margin();
					if (lhstoc_on_lhs === true)
					{
						that.lhstoc_show();
					}
					else
					{
						that.lhstoc_hide();
					}
				});
			}
		});
	},

    event_update_content_margin:function()
    {
        /** based on the width of lhstoc, update the position of the main CONTENTS margin to follow that of the lhstoc */
        
        util.debug("|||||||event_update_content_margin()");
		chrome.storage.sync.get(null, function(item){
			if (item["lhstoc_on_lhs"] === true)
			{
				var lhstoc_width = parseInt($("#lhstoc").css('width'));
				lhstoc_width += 15; //magic css number
				$("#left-navigation").css('margin-left', lhstoc_width);
				$("#content").css('margin-left', lhstoc_width);
				$("#footer").css('margin-left', lhstoc_width);
				$("#btn_div").css("left", lhstoc_width);
				$("#btn_div").css("position", "relative");

				chrome.storage.sync.set({"lhstoc_margin": lhstoc_width});
			}
		});
    },
};
console.log("lhstoc.js");
