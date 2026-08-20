;(() => {
	var root = document.documentElement
	root.dataset.theme = localStorage.getItem("theme") || "dark"
	root.dataset.palette = localStorage.getItem("palette") || "default"
})()
