FROM node:<%=node_image_tag%>
<%= http_endpoint ? ["EXPOSE", port].join(' ') : "" %>