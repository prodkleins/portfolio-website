// Add this to your main JS file or inside a <script> tag
function highlightCurrentPage() {
    const page = window.location.pathname.split('/').pop();
    document.getElementById("nav-home").classList.remove("active-page");
    document.getElementById("nav-mywork").classList.remove("active-page");
    document.getElementById("nav-contact").classList.remove("active-page");
    if (page === "index.html" || page === "") {
        document.getElementById("nav-home").classList.add("active-page");
    } else if (page === "mywork.html") {
        document.getElementById("nav-mywork").classList.add("active-page");
    } else if (page === "contact.html") {
        document.getElementById("nav-contact").classList.add("active-page");
    }
}

// Call this after your navbar loads
highlightCurrentPage();