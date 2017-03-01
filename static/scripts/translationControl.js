var alterMenu = new AlterMenu();

/* When the document has finished loading,
 * bind all necessary listeners. */
$(document).ready(function() {
	disableHREF();

	/* If you click anywhere in the translatable window,
	 * and the alterMenu is open, we close it. */
	$('.translatable').click(function() {
        if (alterMenu.isOpen())
            alterMenu.close();
    });

	/* When the translate toggle is changed, we
	 * make sure that we disable or enable hyperlinks
	 * and close all translation tools. */
	$(HTML_ID_TOGGLETRANSLATE).change(function()
	{
		if (this.checked)
			disableHREF();
		else
		{
			alterMenu.close();
			enableHREF();
		}
	});

	/* When a translatable word has been clicked,
	 * either try to translate it or open an alternative
	 * translation window.  */
	$(HTML_ZEEGUUTAG).click(function() {
	    if (!$(HTML_ID_TOGGLETRANSLATE).is(':checked'))
	        return;

	    if (alterMenu.isOpen())
	        return;

        if (isTranslated(this)) {
            alterMenu.open(this);
        } else {
            insertTranslation(this);
        }
	});
});

/* Every time the screen changes, we need to
 * reposition the alter menu to be at the correct word
 * position. */
$(window).on("resize", function() {
	if (alterMenu.isOpen())
	{
        var zeeguuTag = alterMenu.getAnchor();
		alterMenu.place(zeeguuTag);
		$(HTML_ID_ALTERMENU).show();
	}
});

// Disable or enable links.
// Done in this peculiar way as default link disabling methods do not
// pass a proper text selection.
function disableHREF()
{
	$('.translatable').find('a').each(function()
	{
		this.setAttribute('href_disabled',this.getAttribute('href'));
		this.removeAttribute('href');
	});
}

function enableHREF()
{
	$('.translatable').find('a').each(function()
	{
		this.setAttribute('href',this.getAttribute('href_disabled'));
		this.removeAttribute('href_disabled');
	});
}