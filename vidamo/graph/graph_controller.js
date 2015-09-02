//
// VIDAMO Left Graph controller
//

vidamo.controller('graphCtrl',[
                    '$scope',
                    'generateCode',
                    'nodeCollection',
                    'prompt',
    function($scope,generateCode,nodeCollection,prompt) {

        // synchronization with vidamo application data pool

        // generated javascript code
        $scope.javascriptCode = generateCode.getJavascriptCode();
        $scope.$watch('javascriptCode', function () {
            generateCode.setJavascriptCode($scope.javascriptCode);
        });
        $scope.$watch(function () { return generateCode.getJavascriptCode(); }, function () {
            $scope.javascriptCode = generateCode.getJavascriptCode();
        });

        // function code for procedures
        $scope.codeList = generateCode.getCodeList();
        $scope.$watch('codeList', function () {
            generateCode.setCodeList($scope.codeList);
        });
        $scope.$watch(function () { return generateCode.getCodeList(); }, function () {
            $scope.codeList = generateCode.getCodeList();
        });

        // procedure data list
        $scope.dataList = generateCode.getDataList();
        $scope.$watch('dataList', function () {
            generateCode.setDataList($scope.dataList);
        });
        $scope.$watch(function () { return generateCode.getDataList(); }, function () {
            $scope.dataList = generateCode.getDataList();
        });

        // interface data list
        $scope.interfaceList= generateCode.getInterfaceList();
        $scope.$watch('interfaceList', function () {
            generateCode.setInterfaceList($scope.interfaceList);
        });
        $scope.$watch(function () { return generateCode.getInterfaceList(); }, function () {
            $scope.interfaceList= generateCode.getInterfaceList();
        });

        // graph flowchart view model
        // pass by reference
        // watch chartViewModel.data instead of chartViewModel to prevent stack limit exceeded
        $scope.chartViewModel= generateCode.getChartViewModel();
        $scope.$watch('chartViewModel.data', function () {
            generateCode.generateCode();
        },true);

        $scope.$watch(function () { return generateCode.getChartViewModel(); }, function () {
            if(generateCode.getChartViewModel() !== $scope.chartViewModel){
                $scope.chartViewModel= generateCode.getChartViewModel();
            }
        });

        // synchronization with node collection
        // new node type
        $scope.nodeTypes = function(){
            return nodeCollection.getNodeTypes();
        };

        // for generate node name
        $scope.nextNodeId = 0;

        // currently selected node ID
        $scope.nodeIndex = '';

        // currently selected node name
        $scope.currentNodeName = '';

        // Setup the data-model for the chart.
        var chartDataModel = {
            nodes: [],
            connections: []
        };

        // Create the view-model for the chart and attach to the scope.
        $scope.chartViewModel = new flowchart.ChartViewModel(chartDataModel);

        // verify the function name
        // fixme replace eval with regex
        function isValidName(inputName) {
            if(inputName){
                var testString =  'function ' + inputName  + '(){};';

                try{
                    eval(testString);
                }
                catch(err){
                    document.getElementById('log').innerHTML += "<div style='color: red'>Error: invalid name!</div>";
                    return false;
                }
                return true;
            }else{
                document.getElementById('log').innerHTML += "<div style='color: red'>Error: invalid name!</div>";
                return false;
            }
        }

        // listen to the graph, when a node is clicked, update the visual procedure/ code/ interface accordions
         $scope.$on("nodeIndex", function(event, message) {

             $scope.nodeIndex = message;

             $scope.currentNodeName =  $scope.chartViewModel.nodes[$scope.nodeIndex].data.name;
         });


        // Add a new node to the chart.
        // todo integrate with fancy prompt

        $scope.addNewNode = function (type) {
            if(type === 'create new type'){
                // install new node type and update type
                type = $scope.createNewNodeType();
                if(!type){
                    return;
                }
            }

            // prompt for name of new node and validate
            var nodeName = prompt('Enter a name for new node:', 'node' + $scope.nextNodeId);
            if (!isValidName(nodeName)) {return;}

            // update node name, node id and location
            var newNodeDataModel = {};
            newNodeDataModel.id = $scope.chartViewModel.nodes.length;
            newNodeDataModel.name = nodeName;
            newNodeDataModel.x = 1900;
            newNodeDataModel.y = 2100;
            newNodeDataModel.inputConnectors = nodeCollection.getInputConnectors(type);
            newNodeDataModel.outputConnectors = nodeCollection.getOutputConnectors(type);
            newNodeDataModel.type = type;
            newNodeDataModel.version = 0;
            newNodeDataModel.overwrite = nodeCollection.getOverwrite(type);

            // when new node added, increase the number of procedure list by one
            $scope.dataList.push(nodeCollection.getProcedureDataModel(type));

            // when new node added, add new code block
            $scope.codeList.push('//\n' + '// To generate code, create nodes & procedures and run!\n' + '//\n');

            // when new node added, increase the number of interface list by one
            $scope.interfaceList.push(nodeCollection.getInterfaceDataModel(type));

            // todo interface code list

            // add new node data model to view model
            $scope.chartViewModel.addNode(newNodeDataModel);

            // clean dropdown menu -> flowchart directive
            $scope.$emit('cleanGraph');

            $scope.nextNodeId++;
        };

        // create and install a new node type
        $scope.createNewNodeType = function (){
            // prompt for name of new type and validate
            var newTypeName = prompt('Enter a node for new type:');

            if (!isValidName(newTypeName)) {return;}
            if ($scope.nodeTypes().indexOf(newTypeName) >= 0 ){
                document.getElementById('log').innerHTML += "<div style='color: red'>Error: node type name exists!</div>"
                return;
            }

            var newProcedureDataModel =  [];
            var newInterfaceDataModel = [];

            nodeCollection.installNewNodeType(newTypeName,newProcedureDataModel,newInterfaceDataModel);

            return newTypeName;
        };

        // Add an input connector to selected nodes.
        $scope.$on("newInputConnector",function () {
            try{
                setTimeout(function(){
                    var connectorName = prompt("Enter a connector name:", "in"
                        + $scope.chartViewModel.nodes[$scope.nodeIndex].inputConnectors.length
                        + '_'
                        + $scope.chartViewModel.nodes[$scope.nodeIndex].data.name);

                    if (!isValidName(connectorName)) {
                        return;
                    }

                    var selectedNodes = $scope.chartViewModel.getSelectedNodes();

                    for (var i = 0; i < selectedNodes.length; ++i) {
                        var node = selectedNodes[i];

                        node.addInputConnector({
                            name: connectorName,
                            value:''
                        });
                    }
                },0);
            }
            catch(err){
                document.getElementById('log').innerHTML += "<div style='color: red'>Error: no node selected!</div>";
            }

            // update generated code
            generateCode.generateCode();
        });

        // Add an output connector to selected nodes.

        $scope.$on("newOutputConnector",function () {

            try{
                setTimeout(function(){
                    var connectorName = prompt("Enter a connector name:", "out"
                        + $scope.chartViewModel.nodes[$scope.nodeIndex].outputConnectors.length);

                    if (!isValidName(connectorName)) {
                        return;
                    }

                    var selectedNodes = $scope.chartViewModel.getSelectedNodes();

                    for (var i = 0; i < selectedNodes.length; ++i) {
                        var node = selectedNodes[i];
                        node.addOutputConnector({
                            name: connectorName,
                            value: ""
                        });
                    }
                },0);
            }
            catch(err){
                document.getElementById('log').innerHTML += "<div style='color: red'>Error: no node selected!</div>";
            }

            // update generated code
            generateCode.generateCode();
        });

        // Delete selected nodes and connections in data&view model

        $scope.$on("deleteSelected", function (){
            var deletedNodeIds = $scope.chartViewModel.deleteSelected();

            // ensure the deleted ids are sorted in ascend order
            // deletedNodeIds.sort(function(a,b){return b-a;});

            // update only if selected is a node
            // reverse order, otherwise mess up

            for(var i = deletedNodeIds.length -1; i >= 0 ; i--){
                // update scene data structure
                $scope.dataList.splice(deletedNodeIds[i],1);
                $scope.codeList.splice(deletedNodeIds[i],1);
                $scope.interfaceList.splice(deletedNodeIds[i],1);
            }

            // update generated code
            generateCode.generateCode();
        });


        $scope.$on("renameSelected",function(){
            setTimeout(function(){
                var newName = prompt('Enter a new name:');
                $scope.chartViewModel.renameSelected(newName);
            }, 0);
        });


        $scope.$on("Save as new type",function(){

        });

    }]);