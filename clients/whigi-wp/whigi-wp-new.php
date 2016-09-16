<?php 
if(!defined('WPINC'))
	exit ('Do not access this file directly.');
?>

<html>
    <head>
        <title>Whigi</title>
    </head>
    <body>
    <div id="new-users-whigi">
        <?php if(isset($_FILES['file'])) {
            if($_FILES['file']['error'] != UPLOAD_ERR_OK) {
                die('<p>Cannot load your file.</p>');
            } else {
                $i18n = get_option('whigi_i18n_en');
                $gen = get_option('whigi_generics');
                $fields = get_option('whigi_whigi_data').split('//');
                $csv = fopen($_FILEs['file']['tmp_name'], "r");
                while(($row = fgetcsv($csv, 0, ',', '\'', '\\')) != FALSE) {
                    $username = 'tmp' . explode('.', uniqid('', true))[0];
                    $password = 'tmp' . explode('.', uniqid('', true))[0];
                    $hpwd = hash('sha256', $password);
                    
                    //Create account
                    $url = "https://" . get_option('whigi_whigi_host') . "/api/v1/user/create?captcha=" . $_POST['g-recaptcha-response'];
                    $fields = json_encode(array(
                        'username' => $username,
                        'password' => $password
                    ));
                    $curl = curl_init();
                    curl_setopt($curl, CURLOPT_URL, $url);
                    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'POST');
                    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
                    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, (get_option('whigi_http_util_verify_ssl') == 1 ? 1 : 0));
                    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, (get_option('whigi_http_util_verify_ssl') == 1 ? 2 : 0));
                    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Length: ' . strlen($fields), 'Content-type: application/json')); 
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $fields); 
                    $result = json_decode(curl_exec($curl), true);
                    if($result['error'] != '') {
                        echo 'Cannot register one user.<br />';
                        continue;
                    }

                    //Retrieve profile
                    $url = "https://" . $username . ":" . $hpwd . "@" . get_option('whigi_whigi_host') . "/api/v1/profile";
                    $curl = curl_init();
                    curl_setopt($curl, CURLOPT_URL, $url);
                    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
                    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, (get_option('whigi_http_util_verify_ssl') == 1 ? 1 : 0));
                    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, (get_option('whigi_http_util_verify_ssl') == 1 ? 2 : 0));
                    $result = json_decode(curl_exec($curl), true);
                    $msk = openssl_decrypt(implode(array_map("chr", $result['encr_master_key'])), 'AES-256-CTR',
                        implode(array_map("chr", WHIGI::toBytes(hash('sha256', $password . $result['salt'])))), true);

                    //Creates data's and shares'
                    $index = 0;
                    foreach($fields as $key => $val) {
                        if($gen[$val]['is_dated']) {
                            $row[$index] = json_decode($row[$index], true);
                            foreach($row[$index] as $k => $v) {
                                $row[$index][$k]['from'] = strtotime($v['from']) * 1000;
                            }
                            $row[$index] = json_encode($row[$index]);
                        }

                        //Data
                        $url = "https://" . $username . ":" . $hpwd . "@" . get_option('whigi_whigi_host') . "/api/v1/profile/data/new";
                        $encr_data = openssl_encrypt(mb_convert_encoding($row[$index], 'utf-8', 'iso-8859-1'), 'AES-256-CTR', $msk, true);
                        $fields = json_encode(array(
                            'encr_data' => $encr_data,
                            'is_dated' => $gen[$val]['is_dated'],
                            'data_name' => $val . ($gen[$val]['is_folder'])? '/default' : ''
                        ));
                        $curl = curl_init();
                        curl_setopt($curl, CURLOPT_URL, $url);
                        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'POST');
                        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
                        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, (get_option('whigi_http_util_verify_ssl') == 1 ? 1 : 0));
                        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, (get_option('whigi_http_util_verify_ssl') == 1 ? 2 : 0));
                        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Length: ' . strlen($fields), 'Content-type: application/json')); 
                        curl_setopt($ch, CURLOPT_POSTFIELDS, $fields); 
                        $result = json_decode(curl_exec($curl), true);
                        if($result['error'] != '') {
                            echo 'Cannot register one key for a user.<br />';
                            $index++;
                            continue;
                        }

                        //Share
                        $url = "https://" . $username . ":" . $hpwd . "@" . get_option('whigi_whigi_host') . "/api/v1/vault/new";
                        $nk = openssl_random_pseudo_bytes(32);
                        openssl_public_encrypt(WHIGI::pkcs1pad2($nk), $encr_aes, get_option('whigi_rsa_pub_key'), OPENSSL_NO_PADDING);
                        $encr_data = openssl_encrypt(mb_convert_encoding($row[$index], 'utf-8', 'iso-8859-1'), 'AES-256-CTR', $nk, true);
                        $fields = json_encode(array(
                            'data_name' => $val,
                            'shared_to_id' => get_option('whigi_whigi_id'),
                            'aes_crypted_shared_pub' => base64_encode($encr_aes),
                            'data_crypted_aes' => $encr_data,
                            'expire_epoch' => 0,
                            'trigger' => get_option('whigi_whigi_trigger'),
                            'real_name' => $val . ($gen[$val]['is_folder'])? '/default' : ''
                        ));
                        $curl = curl_init();
                        curl_setopt($curl, CURLOPT_URL, $url);
                        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'POST');
                        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
                        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, (get_option('whigi_http_util_verify_ssl') == 1 ? 1 : 0));
                        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, (get_option('whigi_http_util_verify_ssl') == 1 ? 2 : 0));
                        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Length: ' . strlen($fields), 'Content-type: application/json')); 
                        curl_setopt($ch, CURLOPT_POSTFIELDS, $fields); 
                        $result = json_decode(curl_exec($curl), true);
                        if($result['error'] != '') {
                            echo 'Cannot register one grant for a user.<br />';
                            $index++;
                            continue;
                        }

                        if($val == 'profile/email') {
                            wp_mail($row[$index], "Account created for you at " . get_bloginfo('name'), 'The administrator at <a href="' . get_bloginfo('url') . '">'
                                . get_bloginfo('name') . '</a> has created a Whigi account for you with details you previously shared with him.<br />'
                                . 'Using this Whigi account will allow both of you to manage data more consistently, learn more about it <a href="' . 
                                get_option('whigi_whigi_host') . '">Whigi</a>. If you already have a Whigi account, feel free to merge this one into it.<br />'
                                . 'Username: ' . $username . ' Password: ' . $password, 'Content-type: text/html');
                        }
                        $index++;
                    }

                    //Register user as WP user to be displayed.
                    WHIGI::get_instance()->whigi_match_wordpress_user(array(
                        '_id' => $username
                    ));
                    echo 'User successfully imported.<br />';
                }
            }
        } else { ?>
            <a href="<?php echo get_bloginfo('url'); ?>/wp-admin">Back</a>
            <p>
                <?php if(get_option('whigi_whigi_id') == 'whigi-gwp' || !preg_match("/.*profile\/email.*/", get_option('whigi_whigi_data')) || strtolower(get_option('whigi_http_util')) != 'curl') { ?>
                    Sorry, you cannot use this functunality until you have changed the linked administrator account of this Wordpress site. 
                    This can be done <a href="/wp-admin/options-general.php?page=Whigi-WP.php">here</a>.<br />
                    You also cannot use this option if you do not require the email from your people.<br />
                    You must set you HTTP module to cURL as well.
                <?php } else { ?>
                    Using the following form, you will be able to load you current database into linked Whigi accounts. The expected file should be a CSV file
                    whose columns are the same as the columns you require in your <a href="/wp-admin/options-general.php?page=Whigi-WP.php">settings</a>, in
                    the same order, therefore, you should make sure to include already what you need here before hand.<br />
                    In the case of a dated field, the form expects a column holding as value a string such as: [{"from": "Jan 1 1980", "value": "Value1"}, {"from": "Jan 2 1982", "value": "Value2"}].<br />
                    In the case of keyed field, the form expects it to be: {"key1": "Value1", "key2": "Value2"}.<br />
                    Dated field can wrap keyed fields.<br /><br />
                    If your fields have commas inside, you should single-quote the whole value of that column. If there are single-quotes insides, those should be escaped
                    using a backslash character.<br />

                    <script src="https://www.google.com/recaptcha/api.js"></script>
                    <form enctype="multipart/form-data" action="/wp-admin?whigi-new=true" method="post">
                    <input type="hidden" name="MAX_FILE_SIZE" value="18000000" />
                    Select your CSV file: <input name="file" type="file" />
                    <div class="g-recaptcha" data-sitekey="6LfleigTAAAAALOtJgNBGWu4A0ZiHRvetRorXkDx"></div>
                    <input type="submit" value="Process the file" />
                </form>
                <?php } ?>
            <p>    
        <?php } ?>
    </div>
    </body>
</html>