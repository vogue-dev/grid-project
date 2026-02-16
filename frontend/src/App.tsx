import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DataGrid } from "./components/DataGrid";

import "./styles.css";

const queryClient = new QueryClient();

const App = () => {
  	return (
		<QueryClientProvider client={queryClient}>
	  	<DataGrid />
		</QueryClientProvider>
  	);
};

export default App;
