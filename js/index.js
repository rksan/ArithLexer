//@use jQuery

$(function() {
	$(document)
		.find("#go")
		.on("click", function() {
			var value = $(document)
				.find("input[name=input_arith_sequence]")
				.val();

			var tree = _Arith.parseTree(value);
			var infix = _Arith.infix(tree);
			var prefix = _Arith.prefix(tree);
			var postfix = _Arith.postfix(tree);
			var result = _Arith.calc(tree);

			var $table = $("<table />").css({
				'border-collapse':' collapse'
			});
			var $tr = $("<tr />").css({
				"border-top": "1px solid gray",
				"border-bottom": "1px solid gray"
			});
			var $th = $("<th />").css({
				'text-align': 'right'
			});
			var $td = $("<td />");

			$table.append(
				$tr.clone().append($th.clone().text("infix -> "), $td.clone().text(infix)),
				$tr.clone().append($th.clone().text("prefix -> "), $td.clone().text(prefix)),
				$tr.clone().append($th.clone().text("postfix -> "), $td.clone().text(postfix)),
				$tr.clone().append($th.clone().text("result -> "), $td.clone().text(result))
			);

			$(document)
				.find("#console")
				.append($table);
		});
});