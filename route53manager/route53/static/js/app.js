$(function() {

    $("#addBtn").attr("disabled", true)
    //add by paul for swap
    $("#swapBtn").attr("disabled", true)
    //add by paul for route53
    $("#addAws").attr("disabled", true)

    $("#checkBtn").click(function() {
        checkRecords()
        $("#addBtn").attr("disabled", false)
    }) 

    $("#addBtn").click(function() {
        addRecords()
    })

    //add by paul for route53
    $("#checkAws").click(function() {
        checkAwsRecords()
        $("#addAws").attr("disabled", false)
    }) 

    //add by paul for route53
    $("#addAws").click(function() {
        addAwsRecords()
    })

    //add by paul for swap
    $("#preBtn").click(function() {
        backupFile()
        $("#swapBtn").attr("disabled", false)
    }) 

    //add by paul for swap
    $("#swapBtn").click(function() {
        swapRecords()
    })

    $("#printFormatBtn").click(function() {
        printFormat()
    })

    $("#printOAFormatBtn").click(function() {
        printOAFormat()
    })

    changeActiveMenu(window.location.pathname)

}) 

function changeActiveMenu(path){
        if(path.match('/format')){
            $('li').removeClass('active')
            $('#formatMenu').addClass('active')
        } else if(path.match('/oaformat')){
            $('li').removeClass('active')
            $('#oaFormatMenu').addClass('active')
        }
}

function checkFQDN(fqdn){
    good = /^[a-z0-9\-\*]+(\.[a-z0-9\-\*]+)+$/i
    return good.test(fqdn)
}

function checkIPv4(ip){
    good = /^(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/
    return good.test(ip)
}

function selectText(e) {
    var d = document;
    var t = d.getElementById(e);
    var r, s;
    s = window.getSelection();     
    s.removeAllRanges();            
    r = d.createRange();
    r.selectNodeContents(t);
    s.addRange(r);
}

function createSwapResultTable(res){
    ret = "<label>Result</label>"
    ret += '<table class="table table-bordered"><thead><tr><th class="titleText">FQDN</th><th class="titleText">dig @ns[123].11stcorp.com</th><th class="titleText">Records In Zonefile</th>/tr></thead><tbody>' 
    for (fqdn in res){
        rows = res[fqdn]['record'].length
        ret += '<tr>'
        if(rows > 1){
            ret += '<td rowspan=' + rows + '>' + fqdn + '</td>'
            ret += '<td rowspan=' + rows + '><div class="pre">' + res[fqdn]['dig'] + '</div></td>'
            for(i in res[fqdn]['record']){
                record = res[fqdn]['record'][i]
                if(i == 0){
                    ret += '<td><div class="pre">' + record + '</div></td></tr>'
                } else {
                    ret += '<tr><td><div class="pre">' + record + '</div></td></tr>'
                }
            }
        } else if(rows == 1){
            ret += '<td>' + fqdn + '</td>'
            ret += '<td><div class="pre">' + res[fqdn]['dig'] + '</div></td>'
            record = res[fqdn]['record'][0]
            if(record.indexOf('ERROR') == -1){
                ret += '<td><div class="pre">' + record + '</div></td></tr>'
            } else {
                ret += '<td><div class="pre">' + record + '</div></td></tr>'
            }
        } else {
            ret += '<td>' + fqdn + '</td>'
            ret += '<td><div class="pre">' + res[fqdn]['dig'] + '</div></td>'
            ret += '<td></td><td></td></tr>'
        }
    }
    ret += "</tbody></table>"
    for (fqdn in res){
        dig = res[fqdn]['dig'].split('\n')[0].replace('ns1 : ', '')
        a = 24 - fqdn.length
        line = fqdn
        while(a>0){
            line += ' '
            a--
        }
        line += "\t" + dig + "\n"
        ret += line
    }
    //ret += "</div>"
    return ret
}

function createResultTable(res){
    ret = "<label>Result</label>"
    ret += '<table class="table table-bordered"><thead><tr><th class="titleText">FQDN</th><th class="titleText">dig @ns[123].11stcorp.com</th><th class="titleText">Records In Zonefile</th><th><button type="button" class="btn btn-danger" id="deleteBtn">선택 삭제</button></th></tr></thead><tbody>' 
    for (fqdn in res){
        rows = res[fqdn]['record'].length
        ret += '<tr>'
        if(rows > 1){
            ret += '<td rowspan=' + rows + '>' + fqdn + '</td>'
            ret += '<td rowspan=' + rows + '><div class="pre">' + res[fqdn]['dig'] + '</div></td>'
            for(i in res[fqdn]['record']){
                record = res[fqdn]['record'][i]
                if(i == 0){
                    ret += '<td><div class="pre">' + record + '</div></td><td><div class="checkbox checkbox-mini"><label><input type="checkbox" value="' + fqdn + ':' + record + '"></label></div></td></tr>'
                } else {
                    ret += '<tr><td><div class="pre">' + record + '</div></td><td><div class="checkbox checkbox-mini"><label><input type="checkbox" value="' + fqdn + ':' + record + '"></label></div></td></tr>'
                }
            }
        } else if(rows == 1){
            ret += '<td>' + fqdn + '</td>'
            ret += '<td><div class="pre">' + res[fqdn]['dig'] + '</div></td>'
            record = res[fqdn]['record'][0]
            if(record.indexOf('ERROR') == -1){
                ret += '<td><div class="pre">' + record + '</div></td><td><div class="checkbox checkbox-mini"><label><input type="checkbox" value="' + fqdn + ':' + record + '"></label></div></td></tr>'
            } else {
                ret += '<td><div class="pre">' + record + '</div></td><td></td></tr>'
            }
        } else {
            ret += '<td>' + fqdn + '</td>'
            ret += '<td><div class="pre">' + res[fqdn]['dig'] + '</div></td>'
            ret += '<td></td><td></td></tr>'
        }
    }
    ret += "</tbody></table>"
    ret += "<label>ITSM Comment</label>"
    ret += '<button type="button" class="btn btn-info" id="selectTextBtn">텍스트 선택</button>'
    ret += '<div class="pre greyBox" id="itsmResult">'
    ret += '요청하신 DNS 등록 완료되었습니다.\n'
    ret += "{code}\n"
    for (fqdn in res){
        dig = res[fqdn]['dig'].split('\n')[0].replace('ns1 : ', '')
        a = 24 - fqdn.length
        line = fqdn
        while(a>0){
            line += ' '
            a--
        }
        line += "\t" + dig + "\n"
        ret += line
    }
    ret += "{code}"
    ret += "</div>"
    return ret
}

//add by paul for route53
function checkAwsRecords(){
    var itsm = $.trim($("#itsm").val()) 
    var input = $.trim($("#input").val()) 
    if (!input){
        alert('FQDN 값을 입력해주세요!')
        return
    }
    lines = input.split("\n") 
    for (i in lines){
        line = $.trim(lines[i]).split(/\s+/)
        if(line[0] == ''){
            continue
        }
        fqdn = line[0] 
        if (!checkFQDN(fqdn)){
            alert('올바른 형식의 FQDN이 아닙니다 : ' + fqdn)
            return
        }
    }        
    var data = {
        action: "checkAwsRecordExist",
        args: {
            input: input,
            itsm: itsm
        }
    } 
    data = JSON.stringify(data) 
    $("#checkAws").attr("disabled", true) 
    $("#result").html('<img src="static/image/ajax-loader.gif">') 
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "route53Api",
        data: data,
        success: function(res) {
            res = JSON.parse(res) 
            ret = createResultTable(res) //
            $("#result").html(ret)
            $("#deleteAws").click(function() {
                deleteSelected()
            })
            $("#selectTextBtn").click(function(){
                selectText('itsmResult');
            });
            $("#checkAws").attr("disabled", false) 
        }
    })  
}

//add by paul for route53
function addAwsRecords(){
    var itsm = $.trim($("#itsm").val())
    var input = $.trim($("#input").val())
    if (!itsm){
        alert('ITSM 티켓 번호를 입력해주세요!')
        return
    }
    if (!input){
        alert('FQDN IP 값을 입력해주세요!')
        return
    }
    lines = input.split("\n") 
    for (i in lines){
        line = $.trim(lines[i]).split(/\s+/)
        if(line[0] == ''){
            continue
        }
        if(line.length != 2){
            alert('입력 양식이 올바르지 않습니다. FQDN IP 형식으로 입력해주세요 : ' + lines[i])
            return
        }
        fqdn = line[0]
        ip = line[1]
        if (!checkFQDN(fqdn)){
            alert('올바른 형식의 FQDN이 아닙니다 : ' + fqdn)
            return
        }
        if (!checkIPv4(ip)){
            alert('올바른 형식의 IPv4 주소가 아닙니다 : ' + ip)
            return
        }
    }
    if(!confirm('확인 버튼을 누르면 바로 추가됩니다. 정말로 진행하시겠습니까?')){
        return
    }
    var data = {
        action: "addAwsNewRecord",
        args: {
            input: input,
            itsm: itsm
        }
    } 
    data = JSON.stringify(data) 
    $("#addAws").attr("disabled", true) 
    $("#result").html('<img src="static/image/ajax-loader.gif">') 
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "route53Api",
        data: data,
        success: function(res) {
            res = JSON.parse(res) 
            ret = createResultTable(res)
            $("#result").html(ret)
            $("#deleteAws").click(function() {
                deleteSelected()
            })  
            $("#selectTextBtn").click(function(){
                selectText('itsmResult');
            });                    
            $("#addAws").attr("disabled", false) 
        }
    }) 
}

function checkRecords(){
    var itsm = $.trim($("#itsm").val()) 
    var input = $.trim($("#input").val()) 
    if (!input){
        alert('FQDN 값을 입력해주세요!')
        return
    }
    lines = input.split("\n") 
    for (i in lines){
        line = $.trim(lines[i]).split(/\s+/)
        if(line[0] == ''){
            continue
        }
        fqdn = line[0] 
        if (!checkFQDN(fqdn)){
            alert('올바른 형식의 FQDN이 아닙니다 : ' + fqdn)
            return
        }
    }        
    var data = {
        action: "checkRecordExist",
        args: {
            input: input,
            itsm: itsm
        }
    } 
    data = JSON.stringify(data) 
    $("#checkBtn").attr("disabled", true) 
    $("#result").html('<img src="static/image/ajax-loader.gif">') 
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "api",
        data: data,
        success: function(res) {
            res = JSON.parse(res) 
            ret = createResultTable(res)
            $("#result").html(ret)
            $("#deleteBtn").click(function() {
                deleteSelected()
            })
            $("#selectTextBtn").click(function(){
                selectText('itsmResult');
            });
            $("#checkBtn").attr("disabled", false) 
        }
    })  
}

//add by paul for swap
function backupFile(){
    var itsm = 'swap'
    var input = $.trim($("#input").val()) 
    if (!input){
        alert('FQDN 값을 입력해주세요!')
        return
    }
    lines = input.split("\n") 
    for (i in lines){
        line = $.trim(lines[i]).split(/\s+/)
        if(line[0] == ''){
            continue
        }
        fqdn = line[0] 
        if (!checkFQDN(fqdn)){
            alert('올바른 형식의 FQDN이 아닙니다 : ' + fqdn)
            return
        }
    }        
    var data = {
        action: "backupZoneFile",
        args: {
            input: input,
            itsm: itsm
        }
    } 
    data = JSON.stringify(data) 
    $("#preBtn").attr("disabled", true) 
    $("#result").html('<img src="static/image/ajax-loader.gif">') 
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "swapApi",
        data: data,
        success: function(res) {
            res = JSON.parse(res)
            ret = createSwapResultTable(res)
            $("#result").html(ret)
        }
    })
}

//add by paul for swap
function swapRecords(){
    var itsm = 'swap'
    var input = $.trim($("#input").val()) 

    if (!input){
        alert('FQDN 값을 입력해주세요!')
        return
    }
    lines = input.split("\n") 
    for (i in lines){
        line = $.trim(lines[i]).split(/\s+/)
        if(line[0] == ''){
            continue
        }
        fqdn = line[0] 
        if (!checkFQDN(fqdn)){
            alert('올바른 형식의 FQDN이 아닙니다 : ' + fqdn)
            return
        }
    }        
    var data = {
        action: "swapNotiRecords",
        args: {
            input: input,
            itsm: itsm
        }
    } 
    data = JSON.stringify(data) 
    $("#preBtn").attr("disabled", true) 
    $("#result").html('<img src="static/image/ajax-loader.gif">') 
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "swapApi",
        data: data,
        success: function(res) {
            res = JSON.parse(res)
            ret = createSwapResultTable(res)
            $("#result").html(ret)
            $("#preBtn").attr("disabled", true) 
            $("#swapBtn").attr("disabled", true) 
        }
    })
}

function addRecords(){
    var itsm = $.trim($("#itsm").val())
    var input = $.trim($("#input").val())
    if (!itsm){
        alert('ITSM 티켓 번호를 입력해주세요!')
        return
    }
    if (!input){
        alert('FQDN IP 값을 입력해주세요!')
        return
    }
    lines = input.split("\n") 
    for (i in lines){
        line = $.trim(lines[i]).split(/\s+/)
        if(line[0] == ''){
            continue
        }
        if(line.length != 2){
            alert('입력 양식이 올바르지 않습니다. FQDN IP 형식으로 입력해주세요 : ' + lines[i])
            return
        }
        fqdn = line[0]
        ip = line[1]
        if (!checkFQDN(fqdn)){
            alert('올바른 형식의 FQDN이 아닙니다 : ' + fqdn)
            return
        }
        if (!checkIPv4(ip)){
            alert('올바른 형식의 IPv4 주소가 아닙니다 : ' + ip)
            return
        }
    }
    if(!confirm('확인 버튼을 누르면 바로 추가됩니다. 정말로 진행하시겠습니까?')){
        return
    }
    var data = {
        action: "addNewRecord",
        args: {
            input: input,
            itsm: itsm
        }
    } 
    data = JSON.stringify(data) 
    $("#addBtn").attr("disabled", true) 
    $("#result").html('<img src="static/image/ajax-loader.gif">') 
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "api",
        data: data,
        success: function(res) {
            res = JSON.parse(res) 
            ret = createResultTable(res)
            $("#result").html(ret)
            $("#deleteBtn").click(function() {
                deleteSelected()
            })  
            $("#selectTextBtn").click(function(){
                selectText('itsmResult');
            });                    
            $("#addBtn").attr("disabled", false) 
        }
    }) 
}

function deleteSelected(){
    selected = []
    $("input:checked").each(function() {
        selected.push($(this).val().replace('\n',''))
    })
    if(selected.length == 0){
        alert('삭제할 대상이 선택되지 않았습니다!')
        return
    }
    if(!confirm('확인 버튼을 누르면 바로 삭제됩니다. 정말로 진행하시겠습니까?')){
        return
    }
    selectedString = selected.join('\n')
    var itsm = $.trim($("#itsm").val())
    if (!itsm){
        alert('ITSM 티켓 번호를 입력해주세요!')
        return
    }
    var input = selectedString     
    var data = {
        action: "deleteRecords",
        args: {
            input: input,
            itsm: itsm
        }
    } 
    data = JSON.stringify(data) 
    $("#deleteBtn").attr("disabled", true) 
    $("#result").html('<img src="static/image/ajax-loader.gif">') 
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "api",
        data: data,
        success: function(res) {
            res = JSON.parse(res)
            if('ERROR' in res){
                ret = createResultTable(res)
                $("#result").html(ret)
            } else {
                $("#checkBtn").click()
            }
        }
    }) 
}

function printFormat(){
    var action = 'format'
    var baseDomain = $.trim($("#baseDomain").val())
    var baseNS = $.trim($("#baseNS").val())
    if (!baseDomain){
        alert('Base Domain을 입력해주세요!')
        return
    }
    if (!checkFQDN(baseDomain)){
        alert('올바른 형식의 FQDN이 아닙니다 : ' + baseDomain)
        return
    }
    if (baseNS){
        if (!checkFQDN(baseNS)){
            alert('올바른 형식의 FQDN이 아닙니다 : ' + baseNS)
            return
        }
    }
    var data = {
        action: action,
        baseDomain: baseDomain,
        baseNameserver: baseNS
    }
    data = JSON.stringify(data) 
    $("#printFormatBtn").attr("disabled", true) 
    $("#result").html('<img src="static/image/ajax-loader.gif">') 
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "formatApi",
        data: data,
        success: function(res) {
            res = JSON.parse(res)
            ret = createFormatResult(res)
            $("#result").html(ret)
            $("#printFormatBtn").attr("disabled", false) 
        }
    }) 
}

function printOAFormat(){
    var action = 'oaformat'
    var fqdn = $.trim($("#fqdn").val())
    var ip = $.trim($("#ip").val())
    if (!fqdn){
        alert('FQDN을 입력해주세요!')
        return
    }
    if (!checkFQDN(fqdn)){
        alert('올바른 형식의 FQDN이 아닙니다 : ' + fqdn)
        return
    }
    if (!ip){
        alert('IP를 입력해주세요!')
        return
    }
    if (!checkIPv4(ip)){
        alert('올바른 형식의 IPv4 주소가 아닙니다 : ' + ip)
        return
    }
    var data = {
        action: action,
        fqdn: fqdn,
        ip: ip
    }
    data = JSON.stringify(data) 
    $("#printOAFormatBtn").attr("disabled", true) 
    $("#result").html('<img src="static/image/ajax-loader.gif">') 
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "oaformatApi",
        data: data,
        success: function(res) {
            res = JSON.parse(res)
            ret = createFormatResult(res)
            $("#result").html(ret)
            $("#printOAFormatBtn").attr("disabled", false) 
        }
    }) 
}





function createFormatResult(res){
    SOA = res['SOA']
    master = res['master']
    slave = res['slave']
    ret = '<label>SOA</label>'
    ret += '<div class="pre greyBox bottom20" id="soaResult">' + SOA + '</div>'
    ret += '<label>Master</label>'
    ret += '<div class="pre greyBox bottom20" id="masterResult">' + master + '</div>'
    ret += '<label>Slave</label>'
    ret += '<div class="pre greyBox bottom20" id="slaveResult">' + slave + '</div>'     
    return ret
}
