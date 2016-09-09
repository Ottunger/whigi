<?php

//Start a PHP session
session_start();

define('HTTP_UTIL', get_option('whigi_http_util'));
define('CLIENT_ID', get_option('whigi_whigi_id'));
define('CLIENT_SECRET', get_option('whigi_whigi_secret'));
define('REDIRECT_URI', rtrim(site_url(), '/') . '/');
define('URL_REG', "https://" . get_option('whigi_whigi_host') . "/account/" . urlencode(CLIENT_ID) . '/');
define('URL_LOG', "https://" . get_option('whigi_whigi_host') . "/remote/" . urlencode(CLIENT_ID) . '/');

//Last URL
if(!$_SESSION['WHIGI']['LAST_URL']) {
	$_SESSION['WHIGI']['LAST_URL'] = strtok($_SERVER['HTTP_REFERER'], "?");
}

if(!CLIENT_ID || !CLIENT_SECRET) {
	$this->whigi_end_login("The third-party authentication provider has not been configured with an API id/secret. Please notify the admin or try again later.");
} elseif(isset($_GET['whigi-connect'])) {
	//Post-auth phase, verify went OK
	if($_GET['whigi-connect'] == 'ok' && isset($_GET['user']) && isset($_GET['response']) && $_GET['response'] != 'null') {
		//Check that $_SESSION['WHIGI']['STATE'] is decrypt(reponse) and build identity
		$url = "https://" . get_option('whigi_whigi_id') . ":" . hash('sha256', get_option('whigi_whigi_secret')) . "@" . get_option('whigi_whigi_host') . "/api/v1/profile/data";
		switch(strtolower(HTTP_UTIL)) {
			case 'curl':
				$curl = curl_init();
				curl_setopt($curl, CURLOPT_URL, $url);
				curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
				curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, (get_option('whigi_http_util_verify_ssl') == 1 ? 1 : 0));
				curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, (get_option('whigi_http_util_verify_ssl') == 1 ? 2 : 0));
				$result = curl_exec($curl);
				break;
			case 'stream-context':
				$opts = array('http' =>
					array(
						'method'  => 'GET'
					)
				);
				$context = stream_context_create($opts);
				$result = @file_get_contents($url, false, $context);
				break;
		}
		//Parse the JSON response
		$result_obj = json_decode($result, true);
		WHIGI::get_instance()->shared_with_me = $result_obj['shared_with_me'];
		if(isset($result_obj['shared_with_me']) && isset($result_obj['shared_with_me'][$_GET['user']]) &&
			isset($result_obj['shared_with_me'][$_GET['user']]['keys/auth/' . CLIENT_ID])) {
			//Retrieve vault
			$url = "https://" . get_option('whigi_whigi_id') . ":" . hash('sha256', get_option('whigi_whigi_secret')) . "@" . get_option('whigi_whigi_host') . "/api/v1/vault/"
				. $result_obj['shared_with_me'][$_GET['user']]['keys/auth/' . CLIENT_ID];
			switch(strtolower(HTTP_UTIL)) {
				case 'curl':
					$curl = curl_init();
					curl_setopt($curl, CURLOPT_URL, $url);
					curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
					curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, (get_option('whigi_http_util_verify_ssl') == 1 ? 1 : 0));
					curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, (get_option('whigi_http_util_verify_ssl') == 1 ? 2 : 0));
					$result = curl_exec($curl);
					break;
				case 'stream-context':
					$opts = array('http' =>
						array(
							'method'  => 'GET'
						)
					);
					$context = stream_context_create($opts);
					$result = @file_get_contents($url, false, $context);
					break;
			}
			//Parse the JSON response
			$result_obj = json_decode($result, true);
			if(isset($result_obj['data_crypted_aes']) && isset($result_obj['aes_crypted_shared_pub'])) {
				openssl_private_decrypt(base64_decode($result_obj['aes_crypted_shared_pub']), $aes_key, get_option('whigi_rsa_pri_key'), OPENSSL_NO_PADDING);
				$aes_key = WHIGI::pkcs1unpad2($aes_key);
				$encrypter = implode(array_map("chr", WHIGI::toBytes(
					openssl_decrypt(mb_convert_encoding($result_obj['data_crypted_aes'], 'iso-8859-1', 'utf8'), 'AES-256-CTR', $aes_key, true))));
				$encr_challenge = openssl_encrypt($_SESSION['WHIGI']['STATE'], 'AES-256-CTR', $encrypter, true);
				if(unpack("C*", $encr_challenge) === unpack("C*", base64_decode($_GET['response']))) {
					$this->whigi_login_user(array(
						"_id" => $_GET['user']
					));
				} else {
					//Cannot log in.
					$this->whigi_end_login("Sorry, we couldn't log you in. We decrypted " . $decr_response . " but the challenge was " . $_SESSION['WHIGI']['STATE']);
				}
			} else {
				//Cannot log in.
				$this->whigi_end_login("Sorry, we couldn't log you in. Our backend connection is corrupted.");
			}
		} else {
			//Cannot log in.
			$this->whigi_end_login("Sorry, we couldn't log you in. It seems that you do not have shared an account to us.");
		} 
	} else {
		//Cannot log in.
		$this->whigi_end_login("Sorry, we couldn't log you in. You have declined the invite.");
	}
} elseif(isset($_GET['whigi-grant'])) {
	if($_GET['whigi-grant'] == 'bad') {
		$_SESSION['WHIGI']['IGNORE_GRANT'] = true;	
	}
	$url = $_SESSION['WHIGI']['LAST_URL'];
	unset($_SESSION['WHIGI']['LAST_URL']);
	header("Location: $url");
	exit;
} else {
	//Pre-auth phase, start the login (the verb _GET['connect'] is set, but we do not use it)
	$this->whigi_clear_login_state();
	$challenge = explode('.', uniqid('', true))[0];
	$_SESSION['WHIGI']['STATE'] = $challenge;

	$data = get_option('whigi_whigi_data');
	$data = array_map(urlencode, $data);
	$data = (count($data) > 0)? implode('//', $data) : '-';

	$urlp2 = URL_LOG . $challenge . '/' . urlencode(REDIRECT_URI . '?whigi-connect=ok');
	$url = URL_REG . urlencode($urlp2) . '/' . urlencode(REDIRECT_URI . '?whigi-connect=bad') . '/true/' . $data . '/' . 
		(time()*1000 + intval(get_option('whigi_whigi_time'))*30*24*60*60*1000) . '/' . urlencode(get_option('whigi_whigi_trigger'));
	header("Location: $url");
	exit;
}

?>